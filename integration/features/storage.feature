Feature: Storage endpoints
  Object writes, deletes, listings, and signed-url issuance for customer media
  (media-uploads) and published AI-generated sites (generated-sites).

  Scenario: Upload an object to a bucket
    When I send a PUT request to "/storage/media-uploads/objects" with body:
      """
      { "path": "logo.png", "body": "data", "contentType": "image/png" }
      """
    Then the response status should be 200
    And the response body should have fields:
      | field  | value        |
      | bucket | media-uploads |
      | name   | logo.png     |
    And the "media-uploads" bucket should contain an object "logo.png"

  Scenario: Uploading to an unknown bucket is rejected
    When I send a PUT request to "/storage/bogus/objects" with body:
      """
      { "path": "logo.png", "body": "data" }
      """
    Then the response status should be 400

  Scenario: Uploading without a path is rejected
    When I send a PUT request to "/storage/media-uploads/objects" with body:
      """
      { "body": "data" }
      """
    Then the response status should be 400

  Scenario: Delete objects from a bucket
    Given the "media-uploads" bucket contains an object "a.png"
    And the "media-uploads" bucket contains an object "b.png"
    When I send a DELETE request to "/storage/media-uploads/objects" with body:
      """
      { "paths": ["a.png", "b.png"] }
      """
    Then the response status should be 200
    And the response body should equal:
      """
      { "removed": ["a.png", "b.png"] }
      """
    And the "media-uploads" bucket should not contain an object "a.png"

  Scenario: Deleting with an empty paths array is rejected
    When I send a DELETE request to "/storage/media-uploads/objects" with body:
      """
      { "paths": [] }
      """
    Then the response status should be 400

  Scenario: List objects in a bucket filtered by prefix
    Given the "generated-sites" bucket contains an object "tenants/site.html"
    And the "generated-sites" bucket contains an object "other/file.txt"
    When I send a GET request to "/storage/generated-sites/objects?prefix=tenants/"
    Then the response status should be 200
    And the response body should equal:
      """
      { "objects": ["tenants/site.html"] }
      """

  Scenario: Issue a signed URL for an object
    When I send a POST request to "/storage/media-uploads/objects/signed-url" with body:
      """
      { "path": "a.png" }
      """
    Then the response status should be 201
    And the response body field "signedUrl" should equal "https://signed.example/media-uploads/a.png?expires=3600"

  Scenario: Issuing a signed URL without a path is rejected
    When I send a POST request to "/storage/media-uploads/objects/signed-url" with an empty body
    Then the response status should be 400
