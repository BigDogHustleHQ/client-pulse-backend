Feature: Dependency health endpoints

  Scenario: Database health succeeds when reachable
    When I GET "/dependencies/database/health"
    Then the response status should be 200
    And the response body should have fields:
      | field  | value |
      | status | ok    |

  Scenario: Database health fails when unavailable
    Given the database is unavailable
    When I GET "/dependencies/database/health"
    Then the response status should be 500

  Scenario: Storage health lists buckets
    When I GET "/dependencies/storage/health"
    Then the response status should be 200
    And the response body should equal:
      """
      { "status": "ok", "buckets": ["media-uploads", "generated-sites"] }
      """
