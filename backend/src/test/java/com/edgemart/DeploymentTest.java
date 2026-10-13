package com.edgemart;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.edgemart.config.*;
import com.mongodb.MongoClientSettings;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class DeploymentTest {
  @Test void publicRootAndDashboardRoutesPreserveTheirFrontendEntryPoints() throws Exception {
    var mvc = MockMvcBuilders.standaloneSetup(new WebsiteController()).build();
    mvc.perform(get("/")).andExpect(forwardedUrl("/landing.html"));
    mvc.perform(get("/?auth=login")).andExpect(forwardedUrl("/index.html"));
    mvc.perform(get("/?department=books")).andExpect(forwardedUrl("/index.html"));
    mvc.perform(get("/delivery")).andExpect(forwardedUrl("/index.html"));
    mvc.perform(get("/delivery/signup")).andExpect(forwardedUrl("/index.html"));
  }
  @Test void staleConnectionsAreRecycledWithoutChangingTlsSettings() {
    var builder = MongoClientSettings.builder().applyToSslSettings(ssl -> ssl.enabled(true));
    new MongoConnections().resilientConnections().customize(builder);
    var settings = builder.build();
    assertTrue(settings.getSslSettings().isEnabled()); assertFalse(settings.getSslSettings().isInvalidHostNameAllowed());
    assertEquals(20, settings.getConnectionPoolSettings().getMaxSize());
    assertEquals(60, settings.getConnectionPoolSettings().getMaxConnectionIdleTime(TimeUnit.SECONDS));
    assertEquals(30, settings.getClusterSettings().getServerSelectionTimeout(TimeUnit.SECONDS));
  }
}
