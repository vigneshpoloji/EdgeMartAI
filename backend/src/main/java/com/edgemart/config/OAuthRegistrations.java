package com.edgemart.config;

import java.util.*;
import org.springframework.core.env.Environment;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.oauth2.client.registration.*;
import org.springframework.stereotype.Component;

@Component
public class OAuthRegistrations
    implements ClientRegistrationRepository, Iterable<ClientRegistration> {
  private final Map<String, ClientRegistration> clients = new LinkedHashMap<>();

  public OAuthRegistrations(Environment env) {
    String backend = env.getRequiredProperty("edgemart.backend-url").replaceAll("/+$", "");
    for (String provider : List.of("google", "github")) {
      String id = env.getProperty("edgemart.oauth." + provider + "-id", ""),
          secret = env.getProperty("edgemart.oauth." + provider + "-secret", "");
      if (id.isBlank() || secret.isBlank()) continue;
      ClientRegistration.Builder b = provider.equals("google")
          ? CommonOAuth2Provider.GOOGLE.getBuilder(provider)
          : CommonOAuth2Provider.GITHUB.getBuilder(provider).scope("read:user", "user:email");
      clients.put(
          provider,
          b.clientId(id)
              .clientSecret(secret)
              .redirectUri(backend + "/login/oauth2/code/" + provider)
              .build());
    }
  }

  public ClientRegistration findByRegistrationId(String id) {
    return clients.get(id);
  }

  public Iterator<ClientRegistration> iterator() {
    return clients.values().iterator();
  }

  public Set<String> providers() {
    return clients.keySet();
  }
}
