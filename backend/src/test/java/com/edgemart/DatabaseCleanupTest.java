package com.edgemart;
import com.mongodb.ConnectionString;import com.mongodb.client.MongoClients;import org.junit.jupiter.api.Test;import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;import org.bson.Document;import java.util.List;import static org.junit.jupiter.api.Assertions.*;
@EnabledIfEnvironmentVariable(named="EDGEMART_CLEANUP_MONGODB_URI",matches=".+")
class DatabaseCleanupTest {
 @Test void clearOnlyExplicitlyConfiguredIsolatedTestDatabase(){String uri=System.getenv("EDGEMART_CLEANUP_MONGODB_URI");String name=new ConnectionString(uri).getDatabase();assertNotNull(name);assertTrue(name.matches("edgemart_test_[a-z0-9_]{4,24}"),"Refuse cleanup outside an isolated test database.");try(var client=MongoClients.create(uri)){var database=client.getDatabase(name);for(String collection:List.of("accounts","seller_profiles","products","orders","driver_invitations"))database.getCollection(collection).deleteMany(new Document());}}
}
