Feature: Storage endpoints

  Scenario: Upload an object
    When I PUT "/storage/media-uploads/objects" with body:
      """
      { "path": "logo.png", "body": "data", "contentType": "image/png" }
      """
    Then the response status should be 200
    And the response body should have fields:
      | field  | value         |
      | bucket | media-uploads |
      | name   | logo.png      |

  Scenario: Uploading to an unknown bucket is rejected
    When I PUT "/storage/bogus/objects" with body:
      """
      { "path": "logo.png", "body": "data" }
      """
    Then the response status should be 400

  Scenario: Delete objects
    Given the "media-uploads" bucket contains "a.png"
    When I DELETE "/storage/media-uploads/objects" with body:
      """
      { "paths": ["a.png"] }
      """
    Then the response status should be 200
    And the response body should equal:
      """
      { "removed": ["a.png"] }
      """
    And the "media-uploads" bucket should not contain "a.png"

  Scenario: Deleting with empty paths is rejected
    When I DELETE "/storage/media-uploads/objects" with body:
      """
      { "paths": [] }
      """
    Then the response status should be 400

  Scenario: List objects filtered by prefix
    Given the "generated-sites" bucket contains "tenants/site.html"
    And the "generated-sites" bucket contains "other/file.txt"
    When I GET "/storage/generated-sites/objects?prefix=tenants/"
    Then the response status should be 200
    And the response body should equal:
      """
      { "objects": ["tenants/site.html"] }
      """

  Scenario: Issue a signed URL
    When I POST "/storage/media-uploads/objects/signed-url" with body:
      """
      { "path": "a.png" }
      """
    Then the response status should be 201
    And the response body should equal:
      """
      { "signedUrl": "https://signed.example/media-uploads/a.png?expires=3600" }
      """

  Scenario: Signed URL without a path is rejected
    When I POST "/storage/media-uploads/objects/signed-url" with body:
      """
      {}
      """
    Then the response status should be 400
