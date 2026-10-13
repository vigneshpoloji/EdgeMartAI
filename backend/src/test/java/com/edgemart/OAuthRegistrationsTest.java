package com.edgemart;
import static org.junit.jupiter.api.Assertions.*;
import com.edgemart.config.OAuthRegistrations;
import com.edgemart.config.SecurityConfig;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.env.MockEnvironment;
import org.junit.jupiter.api.Test;
class OAuthRegistrationsTest {
  @Test void bothProvidersOfferAccountSelectionWithoutLosingStateOrCallbacks(){
    MockEnvironment env=new MockEnvironment().withProperty("edgemart.backend-url","https://api.example.test");
    for(String provider:new String[]{"google","github"}){env.withProperty("edgemart.oauth."+provider+"-id","test-id");env.withProperty("edgemart.oauth."+provider+"-secret","test-secret");}
    var resolver=new SecurityConfig(null).authorizationRequests(new OAuthRegistrations(env));
    for(String provider:new String[]{"google","github"}){
      var request=new MockHttpServletRequest("GET","/oauth2/authorization/"+provider);request.setServletPath("/oauth2/authorization/"+provider);
      var authorization=resolver.resolve(request);
      assertNotNull(authorization);assertEquals("select_account",authorization.getAdditionalParameters().get("prompt"));assertFalse(authorization.getState().isBlank());
      assertEquals("https://api.example.test/login/oauth2/code/"+provider,authorization.getRedirectUri());assertTrue(authorization.getAuthorizationRequestUri().contains("prompt=select_account"));
      if(provider.equals("github"))assertTrue(authorization.getScopes().contains("user:email"));else assertTrue(authorization.getAdditionalParameters().containsKey("nonce"));
    }
  }
  @Test void googleAndGitHubUseBackendCallbacksAndRemovedProvidersAreIgnored(){
    MockEnvironment env=new MockEnvironment().withProperty("edgemart.backend-url","http://localhost:8081");
    for(String provider:new String[]{"google","github"}){env.withProperty("edgemart.oauth."+provider+"-id","test-id");env.withProperty("edgemart.oauth."+provider+"-secret","test-secret");}
    env.withProperty("edgemart.oauth.microsoft-id","retired-id").withProperty("edgemart.oauth.microsoft-secret","retired-secret");
    OAuthRegistrations providers=new OAuthRegistrations(env);
    for(String provider:providers.providers())assertEquals("http://localhost:8081/login/oauth2/code/"+provider,providers.findByRegistrationId(provider).getRedirectUri());
    assertEquals(java.util.Set.of("google","github"),providers.providers());assertNull(providers.findByRegistrationId("microsoft"));
  }
}
