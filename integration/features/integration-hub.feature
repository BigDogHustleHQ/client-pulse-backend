Feature: Integration Hub endpoints
  The Integration Hub exposes an uptime probe and inbound webhook intake for
  connected third-party providers.

  Scenario: Health probe reports the hub is up
    When I send a GET request to "/integrations/health"
    Then the response status should be 200
    And the response body should equal:
      """
      { "status": "ok" }
      """

  Scenario: Inbound provider webhook is accepted
    When I send a POST request to "/integrations/webhooks/stripe" with body:
      """
      { "id": "evt_123", "type": "payment_intent.succeeded" }
      """
    Then the response status should be 200

  Scenario Outline: Webhooks from each provider slug are accepted
    When I send a POST request to "/integrations/webhooks/<provider>" with body:
      """
      {}
      """
    Then the response status should be 200

    Examples:
      | provider  |
      | stripe    |
      | twilio    |
      | square    |
      | yelp      |
      | opentable |
