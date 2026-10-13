package com.edgemart.service;

import com.edgemart.commerce.MarketplaceService;
import com.edgemart.model.Product;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ProductService {
  private final MarketplaceService market;

  public ProductService(MarketplaceService market) {
    this.market = market;
  }

  public List<Product> getAllProducts() {
    return market.products(null, null);
  }

  public List<Product> getProductsByCategory(String category) {
    return market.products(category, null);
  }
}
