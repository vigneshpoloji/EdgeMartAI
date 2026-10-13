package com.edgemart.commerce;

import com.fasterxml.jackson.databind.*;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.*;
import java.io.IOException;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.beans.factory.annotation.*;
import org.springframework.stereotype.Component;

@Component
public class GeminiClient {
  private final ObjectMapper json;
  private final String key;
  private final URI endpoint;
  private final HttpClient http=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
  @Autowired public GeminiClient(ObjectMapper json,@Value("${edgemart.gemini.key:}") String key,@Value("${edgemart.gemini.model:gemini-3.1-flash-lite}") String model){
    this(json,key,URI.create("https://generativelanguage.googleapis.com/v1beta/models/"+validModel(model)+":generateContent"));
  }
  // An explicit endpoint allows local HTTP contract tests without a real key or paid API call.
  public GeminiClient(ObjectMapper json,String key,URI endpoint){this.json=json;this.key=key;this.endpoint=endpoint;}
  private static String validModel(String model){if(!model.matches("[A-Za-z0-9][A-Za-z0-9._-]{1,99}"))throw new IllegalArgumentException("Invalid Gemini model name.");return model;}
  public boolean configured(){return key!=null&&!key.isBlank();}
  public String generate(String instruction,List<Map<String,Object>> contents){
    if(!configured())throw new ApiException(503,"GEMINI_NOT_CONFIGURED","Gemini is not configured. The store guide is available.");
    try{
      String body=json.writeValueAsString(Map.of("systemInstruction",Map.of("parts",List.of(Map.of("text",instruction))),"contents",contents,"generationConfig",Map.of("maxOutputTokens",700,"temperature",0.2)));
      var request=HttpRequest.newBuilder(endpoint).timeout(Duration.ofSeconds(8)).header("Content-Type","application/json").header("x-goog-api-key",key).POST(HttpRequest.BodyPublishers.ofString(body)).build();
      HttpResponse<String> response=null;
      for(int attempt=0;attempt<2;attempt++){
        try{response=http.send(request,HttpResponse.BodyHandlers.ofString());}
        catch(IOException error){if(attempt==1)throw new ApiException(503,"GEMINI_NETWORK_ERROR","The AI service could not be reached. Please try again shortly.");pause();continue;}
        if(response.statusCode()==200)break;
        if(attempt==0&&Set.of(408,429,500,502,503,504).contains(response.statusCode())){pause();continue;}
        throw providerFailure(response.statusCode());
      }
      if(response==null||response.statusCode()!=200||response.body().length()>65536)throw unavailable();
      var parts=json.readTree(response.body()).path("candidates").path(0).path("content").path("parts");
      StringBuilder text=new StringBuilder();for(JsonNode part:parts){if(!part.path("thought").asBoolean(false)&&part.path("text").isTextual())text.append(part.get("text").asText());}
      String answer=text.toString().trim();if(answer.isEmpty())throw unavailable();return answer.substring(0,Math.min(answer.length(),4000));
    }catch(InterruptedException error){Thread.currentThread().interrupt();throw unavailable();}
    catch(ApiException error){throw error;}
    catch(Exception error){throw unavailable();}
  }
  private static void pause()throws InterruptedException{Thread.sleep(750+ThreadLocalRandom.current().nextInt(251));}
  private static ApiException providerFailure(int status){
    org.slf4j.LoggerFactory.getLogger(GeminiClient.class).warn("Gemini returned HTTP {} after bounded attempts",status);
    return switch(status){
      case 400,401,403 -> new ApiException(503,"GEMINI_ACCESS_DENIED","The AI service rejected the request. Its configuration needs to be checked.");
      case 404 -> new ApiException(503,"GEMINI_MODEL_UNAVAILABLE","The configured AI model is unavailable.");
      case 429 -> new ApiException(503,"GEMINI_RATE_LIMITED","The AI service usage limit has been reached. Try again later.");
      case 408,500,502,503,504 -> new ApiException(503,"GEMINI_BUSY","The AI service is busy. Please try again shortly.");
      default -> unavailable();
    };
  }
  private static ApiException unavailable(){return new ApiException(503,"GEMINI_UNAVAILABLE","Gemini could not answer right now. Try again shortly or use the store guide.");}
}
