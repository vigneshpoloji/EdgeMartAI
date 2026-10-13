package com.edgemart;
import static org.junit.jupiter.api.Assertions.*;
import com.edgemart.commerce.*;
import com.fasterxml.jackson.databind.*;
import com.sun.net.httpserver.HttpServer;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.atomic.*;
import org.junit.jupiter.api.Test;
class GeminiClientTest {
 @Test void geminiUsesAHeaderSecretAndParsesOnlyVisibleAnswerParts() throws Exception {
  AtomicReference<String> body=new AtomicReference<>(),key=new AtomicReference<>();HttpServer server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
  server.createContext("/generate",request->{body.set(new String(request.getRequestBody().readAllBytes(),StandardCharsets.UTF_8));key.set(request.getRequestHeaders().getFirst("x-goog-api-key"));byte[] reply="{\"candidates\":[{\"content\":{\"parts\":[{\"thought\":true,\"text\":\"internal\"},{\"text\":\"Helpful answer\"}]}}]}".getBytes(StandardCharsets.UTF_8);request.sendResponseHeaders(200,reply.length);request.getResponseBody().write(reply);request.close();});server.start();
  try{var json=new ObjectMapper();var client=new GeminiClient(json,"test-key",URI.create("http://127.0.0.1:"+server.getAddress().getPort()+"/generate"));assertEquals("Helpful answer",client.generate("Store rules",List.of(Map.of("role","user","parts",List.of(Map.of("text","hello"))))));assertEquals("test-key",key.get());assertFalse(body.get().contains("test-key"));assertEquals("Store rules",json.readTree(body.get()).path("systemInstruction").path("parts").path(0).path("text").asText());}finally{server.stop(0);}
 }
 @Test void missingKeyNeverCallsTheProvider(){var client=new GeminiClient(new ObjectMapper(),"",URI.create("http://127.0.0.1:1"));ApiException error=assertThrows(ApiException.class,()->client.generate("rules",List.of()));assertEquals("GEMINI_NOT_CONFIGURED",error.code);}
 @Test void upstreamFailuresDoNotExposeTheirBodyOrKey() throws Exception {
  AtomicInteger calls=new AtomicInteger();HttpServer server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);server.createContext("/generate",request->{calls.incrementAndGet();byte[] reply="secret-key and provider internals".getBytes(StandardCharsets.UTF_8);request.sendResponseHeaders(403,reply.length);request.getResponseBody().write(reply);request.close();});server.start();
  try{var client=new GeminiClient(new ObjectMapper(),"secret-key",URI.create("http://127.0.0.1:"+server.getAddress().getPort()+"/generate"));ApiException error=assertThrows(ApiException.class,()->client.generate("rules",List.of()));assertEquals("GEMINI_ACCESS_DENIED",error.code);assertEquals(1,calls.get());assertFalse(error.getMessage().contains("secret-key"));assertFalse(error.getMessage().contains("internals"));}finally{server.stop(0);}
 }
 @Test void temporaryProviderFailureRetriesOnceAndReturnsTheSuccessfulAnswer() throws Exception {
  AtomicInteger calls=new AtomicInteger();HttpServer server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
  server.createContext("/generate",request->{int attempt=calls.incrementAndGet();byte[] reply=(attempt==1?"Temporary failure":"{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"Recovered answer\"}]}}]}").getBytes(StandardCharsets.UTF_8);request.sendResponseHeaders(attempt==1?503:200,reply.length);request.getResponseBody().write(reply);request.close();});server.start();
  try{var client=new GeminiClient(new ObjectMapper(),"test-key",URI.create("http://127.0.0.1:"+server.getAddress().getPort()+"/generate"));assertEquals("Recovered answer",client.generate("rules",List.of()));assertEquals(2,calls.get());}finally{server.stop(0);}
 }
 @Test void persistentOverloadStopsAfterTwoAttemptsWithASafeBusyError() throws Exception {
  AtomicInteger calls=new AtomicInteger();HttpServer server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);server.createContext("/generate",request->{calls.incrementAndGet();byte[] reply="Private upstream response secret-key".getBytes(StandardCharsets.UTF_8);request.sendResponseHeaders(503,reply.length);request.getResponseBody().write(reply);request.close();});server.start();
  try{var client=new GeminiClient(new ObjectMapper(),"secret-key",URI.create("http://127.0.0.1:"+server.getAddress().getPort()+"/generate"));ApiException error=assertThrows(ApiException.class,()->client.generate("rules",List.of()));assertEquals("GEMINI_BUSY",error.code);assertEquals(2,calls.get());assertFalse(error.getMessage().contains("secret-key"));assertFalse(error.getMessage().contains("Private"));}finally{server.stop(0);}
 }
 @Test void configuredModelCannotChangeTheProviderOrigin(){assertThrows(IllegalArgumentException.class,()->new GeminiClient(new ObjectMapper(),"key","https://another-host/model"));}
}
