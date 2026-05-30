Feature: Dependency health endpoints
  Readiness probes for the tenant database (Supabase Postgres) and blob storage,
  used as deploy/health gates before serving traffic.

  Scenario: Database health probe succeeds when the database is reachable
    When I send a GET request to "/dependencies/database/health"
    Then the response status should be 200
    And the response body field "status" should equal "ok"

  Scenario: Database health probe fails when the database is unavailable
    Given the database is unavailable
    When I send a GET request to "/dependencies/database/health"
    Then the response status should be 500

  Scenario: Storage health probe lists the available buckets
    When I send a GET request to "/dependencies/storage/health"
    Then the response status should be 200
    And the response body should equal:
      """
      { "status": "ok", "buckets": ["media-uploads", "generated-sites"] }
      """
