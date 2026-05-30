Feature: Integration Hub endpoints

  Scenario: Health probe
    When I GET "/integrations/health"
    Then the response status should be 200
    And the response body should equal:
      """
      { "status": "ok" }
      """

  Scenario Outline: Inbound webhooks are accepted
    When I POST "/integrations/webhooks/<provider>" with body:
      """
      {}
      """
    Then the response status should be 200

    Examples:
      | provider |
      | stripe   |
      | twilio   |
