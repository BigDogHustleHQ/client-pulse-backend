Feature: Tenant endpoints
  Read and update a business account (tenant), with every mutation recorded to
  the audit log.

  Background:
    Given a tenant exists with:
      | id     | tenant-1 |
      | name   | Acme     |
      | slug   | acme     |
      | status | active   |

  Scenario: Fetch an existing tenant
    When I send a GET request to "/tenants/tenant-1"
    Then the response status should be 200
    And the response body should have fields:
      | field  | value    |
      | id     | tenant-1 |
      | name   | Acme     |
      | slug   | acme     |
      | status | active   |

  Scenario: Fetching a missing tenant returns 404
    When I send a GET request to "/tenants/does-not-exist"
    Then the response status should be 404

  Scenario: Update a tenant's name and record an audit log entry
    When I send a PATCH request to "/tenants/tenant-1" with body:
      """
      { "name": "Acme Corp" }
      """
    Then the response status should be 200
    And the response body field "name" should equal "Acme Corp"
    And an audit log entry should be recorded for action "tenant.updated"

  Scenario: Suspend a tenant
    When I send a PATCH request to "/tenants/tenant-1" with body:
      """
      { "status": "suspended" }
      """
    Then the response status should be 200
    And the response body field "status" should equal "suspended"

  Scenario: An empty update body is rejected
    When I send a PATCH request to "/tenants/tenant-1" with an empty body
    Then the response status should be 400

  Scenario: An invalid status is rejected
    When I send a PATCH request to "/tenants/tenant-1" with body:
      """
      { "status": "archived" }
      """
    Then the response status should be 400

  Scenario: Updating a missing tenant returns 404
    When I send a PATCH request to "/tenants/does-not-exist" with body:
      """
      { "status": "suspended" }
      """
    Then the response status should be 404
