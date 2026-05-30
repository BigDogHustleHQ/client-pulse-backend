Feature: Tenant endpoints

  Background:
    Given a tenant exists with:
      | id     | tenant-1 |
      | name   | Acme     |
      | slug   | acme     |
      | status | active   |

  Scenario: Fetch an existing tenant
    When I GET "/tenants/tenant-1"
    Then the response status should be 200
    And the response body should have fields:
      | field  | value    |
      | id     | tenant-1 |
      | name   | Acme     |
      | status | active   |

  Scenario: Fetching a missing tenant returns 404
    When I GET "/tenants/missing"
    Then the response status should be 404

  Scenario: Update a tenant and record an audit entry
    When I PATCH "/tenants/tenant-1" with body:
      """
      { "name": "Acme Corp" }
      """
    Then the response status should be 200
    And the response body should have fields:
      | field | value     |
      | name  | Acme Corp |
    And an audit log entry should be recorded for "tenant.updated"

  Scenario: An empty update body is rejected
    When I PATCH "/tenants/tenant-1" with body:
      """
      {}
      """
    Then the response status should be 400

  Scenario: An invalid status is rejected
    When I PATCH "/tenants/tenant-1" with body:
      """
      { "status": "archived" }
      """
    Then the response status should be 400

  Scenario: Updating a missing tenant returns 404
    When I PATCH "/tenants/missing" with body:
      """
      { "status": "suspended" }
      """
    Then the response status should be 404
