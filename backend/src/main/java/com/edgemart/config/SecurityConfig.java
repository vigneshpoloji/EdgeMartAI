package com.edgemart.config;

import com.edgemart.commerce.Account;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.CsrfException;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.Collections;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final CorsConfigurationSource corsConfigurationSource;

    public SecurityConfig(CorsConfigurationSource corsConfigurationSource) {
        this.corsConfigurationSource = corsConfigurationSource;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public HttpSessionSecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public OAuth2AuthorizationRequestResolver authorizationRequests(OAuthRegistrations providers) {
        var resolver=new DefaultOAuth2AuthorizationRequestResolver(providers,"/oauth2/authorization");
        resolver.setAuthorizationRequestCustomizer(builder -> builder.additionalParameters(parameters -> parameters.put("prompt","select_account")));
        return resolver;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, OAuthRegistrations providers,
                                                  OAuthSuccess oauth, OAuth2AuthorizationRequestResolver authorizationRequests) throws Exception {
        HttpSessionCsrfTokenRepository csrfTokens = new HttpSessionCsrfTokenRepository();
        csrfTokens.setHeaderName("X-CSRF-Token");
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(csrf -> csrf.csrfTokenRepository(csrfTokens)
                .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            .logout(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/", "/index.html", "/landing.html", "/privacy.html", "/terms.html", "/delivery", "/delivery/login", "/delivery/signup", "/assets/**", "/images/**", "/logo.svg", "/landing.js", "/favicon.ico").permitAll()
                .requestMatchers("/auth/**", "/api/**", "/oauth2/**", "/login/oauth2/**", "/error").permitAll()
                .anyRequest().authenticated()
            )
            .exceptionHandling(errors -> errors
                .authenticationEntryPoint((req, res, error) -> {
                    res.setStatus(401);
                    res.setContentType("application/json");
                    res.getWriter().write("{\"code\":\"SESSION_EXPIRED\",\"message\":\"Sign in to continue.\"}");
                })
                .accessDeniedHandler((req, res, error) -> {
                    res.setStatus(403);
                    res.setContentType("application/json");
                    String code = error instanceof CsrfException ? "CSRF_EXPIRED" : "ACCESS_DENIED";
                    res.getWriter().write("{\"code\":\"" + code + "\",\"message\":\"Refresh your session and try again.\"}");
                }));

        if (!providers.providers().isEmpty()) {
            http.oauth2Login(login -> login.authorizationEndpoint(endpoint -> endpoint.authorizationRequestResolver(authorizationRequests)).successHandler(oauth)
                .failureHandler((req, res, error) -> res.sendRedirect(oauth.failureUrl())));
        }

        return http.build();
    }

    /**
     * Programmatically signs in an Account into Spring Security's SecurityContext
     * and persists it into the HTTP Session.
     */
    public static void signin(
            Account account,
            HttpServletRequest request,
            HttpServletResponse response,
            HttpSessionSecurityContextRepository repository) {

        String role = "driver".equals(account.role) ? "DRIVER" : "BUYER";
        List<SimpleGrantedAuthority> authorities =
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role));

        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(account.id, null, authorities);

        if (request.getSession(false) != null) request.changeSessionId();
        HttpSession session = request.getSession();
        session.setAttribute("accountId", account.id);
        session.setAttribute("accountVersion", account.sessionVersion);

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);

        if (repository != null) {
            repository.saveContext(context, request, response);
        }
    }
}
