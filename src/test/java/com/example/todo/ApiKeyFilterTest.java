package com.example.todo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class ApiKeyFilterTest {
    @Test
    void rejectsTaskRequestsWithoutTheConfiguredKey() throws Exception {
        ApiKeyFilter filter = new ApiKeyFilter("secret", false);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/tasks");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentAsString()).isEqualTo("{\"message\":\"Unauthorized.\"}");
        assertThat(chain.getRequest()).isNull();
    }

    @Test
    void acceptsTaskRequestsWithTheConfiguredKey() throws Exception {
        ApiKeyFilter filter = new ApiKeyFilter("secret", false);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/tasks");
        request.addHeader(ApiKeyFilter.HEADER_NAME, "secret");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(chain.getRequest()).isSameAs(request);
    }

    @Test
    void leavesHealthChecksPublic() throws Exception {
        ApiKeyFilter filter = new ApiKeyFilter("secret", false);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/actuator/health");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(chain.getRequest()).isSameAs(request);
    }

    @Test
    void refusesToStartOnRenderWithoutAKey() {
        assertThatThrownBy(() -> new ApiKeyFilter("", true))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("APP_API_KEY");
    }

    @Test
    void refusesShortProductionKeys() {
        assertThatThrownBy(() -> new ApiKeyFilter("too-short", true))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("32 characters");
    }
}
