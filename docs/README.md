# Postman to Openapi 

## Command 
    ```
    run `node main.js
    ```

### Documentation Markdown 

  `Prepared`
  ```
    descriptions

    # params-postman-to-openapi

    | object | name | type | required | properties | validate | description | example | default | enum |
    | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

    # body-postman-to-openapi

    | object | name | type | required | omitempty | properties | validate | description | example | default | enum |
    | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

    # response-postman-to-openapi

    | code | object | name | type | omitempty | properties | description | example | default | enum |
    | ---  | --- | --- | --- | --- | --- | --- | --- | --- | --- |

  ```

 - การทำ Markdown
    จาก Prepared ใน 1 request จะมี Header 4 ตัว

    ต้องใส่คำเหล่านี้อยู่ใน `Documentation` ทุกครั้งถ้าต้องการทำ `Markdown`
    (# params-postman-to-openapi)
    (# body-postman-to-openapi)
    (# response-postman-to-openapi)

    1.descriptions
        พิมพ์คำอธิบายที่ต้องการของ request แทนที่คำ `descriptions`

    2.params-postman-to-openapi
        อธิบาย params มี column 10 ตัว
        
        ``` 
        | object | name | type | required | properties | validate | description | example | default | enum |
        ```
        
      -  **object** : `path`
      -  **name** : ชื่อ key ของ params 
      -  **type** : ชื่อ ประเภทข้อมูลของ key ของ params 
      -  **required** : required key ของ params หรือไม่ `true = required, false = not required`
      -  **properties** : คุณสมบัติของ key ของ params 
           - title
           - multipleOf
           - maximum
           - exclusiveMaximum
           - minimum
           - exclusiveMinimum
           - maxLength
           - minLength
           - pattern
           - maxItems
           - minItems
           - uniqueItems
           - maxProperties
           - minProperties
           - enum
      -  **validate** : ชื่อ key ของ params `ของ go validator ใช้ทำ gogengo`
      -  **description** : คำอธิบาย key ของ params 
      -  **example** : ตัวอย่าง key ของ params 
      -  **default** : คำอธิบาย key ของ params 
      -  **enum** : ค่าที่รองรับของ key ของ params 

    3.body-postman-to-openapi

        ```
        | object | name | type | required | omitempty | properties | validate | description | example | default | enum |
        ```

      -  **object** : path ของ field
      -  **name** : ชื่อ key ของ field 
      -  **type** : ชื่อ ประเภทข้อมูลของ key ของ field 
      -  **required** : required key ของ field หรือไม่ `true = required, false = not required`
      -  **omitempty** : คุณสมบัติของ key ของ field `ใช้ทำ gogengo true = omitempty, false = not omitempty`
      -  **properties** : คุณสมบัติของ key ของ field 
           - title
           - multipleOf
           - maximum
           - exclusiveMaximum
           - minimum
           - exclusiveMinimum
           - maxLength
           - minLength
           - pattern 
           - maxItems
           - minItems
           - uniqueItems
           - maxProperties
           - minProperties
           - enum
      -  **validate** : ชื่อ key ของ field `ของ go validator ใช้ทำ gogengo`
      -  **description** : คำอธิบาย key ของ field 
      -  **example** : ตัวอย่าง key ของ field 
      -  **default** : คำอธิบาย key ของ field 
      -  **enum** : ค่าที่รองรับของ key ของ field 

    4.response-postman-to-openapi
       ถ้าต้องการ response code มากกว่าหนึ่งให้ขั้นด้วย  (#### status-code)

        ```
        | code | object | name | type | omitempty | properties | description | example | default | enum |
        ```

      -  **code** : status code
      -  **object** : path ของ field
      -  **name** : ชื่อ key ของ field 
      -  **type** : ชื่อ ประเภทข้อมูลของ key ของ field 
      -  **omitempty** : คุณสมบัติของ key ของ field `ใช้ทำ gogengo true = omitempty, false = not omitempty`
      -  **properties** : คุณสมบัติของ key ของ field 
           - title
           - multipleOf
           - maximum
           - exclusiveMaximum
           - minimum
           - exclusiveMinimum
           - maxLength
           - minLength
           - pattern 
           - maxItems
           - minItems
           - uniqueItems
           - maxProperties
           - minProperties
           - enum
      -  **description** : คำอธิบาย key ของ field 
      -  **example** : ตัวอย่าง key ของ field 
      -  **default** : คำอธิบาย key ของ field 
      -  **enum** : ค่าที่รองรับของ key ของ field 


    - Example
        - request url
        ```
        /pet/info/countries/:counties/language/:language
        ```
        - request body
        ```
            {
                "pet": "dog",
                "info": {
                    "name": "pizza",
                    "age": 1.2,
                    "behavior": [
                        "freindly"
                    ]
                },
                "owner": [
                    {
                        "name": "santa",
                        "age": 30,
                        "address": {
                            "address_1": "174 wo wo town",
                            "city": "dao namex",
                            "country": "wakanda"
                        }
                    }
                ],
                "alive": true
            }
        ```

        - response 201
        ```
            {
                "data": [
                    {
                        "id": "string",
                        "pet": "dog",
                        "info": {
                            "name": "pizza",
                            "age": 1.2,
                            "behavior": [
                                "freindly"
                            ]
                        },
                        "owner": [
                            {
                                "name": "santa",
                                "age": 30,
                                "address": {
                                    "address_1": "174 wo wo town",
                                    "city": "dao namex",
                                    "country": "wakanda"
                                }
                            }
                        ],
                        "alive": true,
                        "created_at": "2022-02-12T04:30:30.359Z"
                    }
                ],
                "pagination": {
                    "offset": 0,
                    "limit": 20,
                    "total": 1,
                    "total_page": 1
                }
            }
        ```

        - response 400
        ```
            {
                "code": "000",
                "type": "Exception",
                "message": "Message describing the error.",
                "user_title": "A title.",
                "user_message": "A message.",
                "details": [
                    {
                        "message": "Message describing the error.",
                        "user_title": "A title.",
                        "user_message": "A message."
                    }
                ],
                "validations": [
                    {
                        "field": "name",
                        "path": "user.name",
                        "tag": "required",
                        "param": "",
                        "value": "",
                        "message": "the format of the data is not valid as required."
                    }
                ]
            }
        ```

        - markdown 
        ```
            create infomation of pet

            # params-postman-to-openapi

            | object | name | type | required | properties | validate | description | example | default | enum |
            | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
            |  | counties | string | true | minimum=10,maximum=100 |  | params | cba | tha | tha,eng |
            |  | language | string | true | minimum=1,maximum=10 |  | hello params | abc | thai | thai,english |

            # body-postman-to-openapi

            | object | name | type | required | omitempty | properties | validate | description | example | default | enum |
            | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
            |  | pet | string | true |  | minimum=1,maximum=10 | min=1,max=10 | pet type | dog |  | dog,cat,bird |
            |  | info | object | false |  |  |  |  |  |  |  |
            | info | name | string | true |  | pattern=\[a-z\] |  | name of pet | pizza |  |  |
            | info | age | float | false |  | title=title_example |  |  |  |  |  |
            | info | behavior | array | false |  |  |  |  | freindly, freindly,  <br>freindly |  |  |
            |  | owner | array | false |  |  |  |  |  |  |  |
            | owner.0 | name | string | false |  |  |  |  |  |  |  |
            | owner.0 | age | integer | false |  |  |  |  |  |  |  |
            | owner.0 | address | object | false |  |  |  |  |  |  |  |
            | owner.0.adress | address_1 | string | false |  |  |  |  |  |  |  |
            | owner.0.adress | city | string | false |  |  |  |  |  |  |  |
            | owner.0.adress | country | string | false |  |  |  |  |  |  |  |
            |  | alive | boolean | false |  |  |  |  |  |  |  |

            # response-postman-to-openapi

            | code | object | name | type | omitempty | properties | description | example | default | enum |
            | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
            | 201 |  | data | object |  |  |  |  |  |  |
            |  | data | id | string |  |  |  |  |  |  |
            |  | data | pet | string |  |  |  |  |  |  |
            |  | data | info | object |  |  |  |  |  |  |
            |  | data.info | name | string |  |  |  |  |  |  |
            |  | data.info | age | float |  |  |  |  |  |  |
            |  | data.info | behavior | array |  |  |  |  |  |  |
            |  | data | owner | array |  |  |  |  |  |  |
            |  | data.owner.0 | name | string |  |  |  |  |  |  |
            |  | data.owner.0 | age | integer |  |  |  |  |  |  |
            |  | data.owner.0 | address | object |  |  |  |  |  |  |
            |  | data.owner.0.address | address_1 | string |  |  |  |  |  |  |
            |  | data.owner.0.address | city | string |  |  |  |  |  |  |
            |  | data.owner.0.address | country | string |  |  |  |  |  |  |
            |  | data | alive | boolean |  |  |  |  |  |  |
            |  | data | created_at | string |  |  |  |  |  |  |

            #### status-code

            | code | object | name | type | omitempty | properties | description | example | default | enum |
            | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
            | 400 |  | code | object |  |  |  |  |  |  |
            |  |  | type | string |  |  | error 400 |  |  |  |
            |  |  | message | string |  |  |  | 400 |  |  |
            |  |  | user_title | string |  |  |  |  |  |  |
            |  |  | user_message | string |  |  |  |  |  |  |
            |  |  | details | array |  |  |  |  |  |  |
            |  | details.0 | message | string |  |  |  |  |  |  |
            |  | details.0 | user_title | string |  |  |  |  |  |  |
            |  | details.0 | user_message | string |  |  |  |  |  |  |
            |  |  | validations | array |  |  |  |  |  |  |
            |  | validations.0 | field | string |  |  |  |  |  |  |
            |  | validations.0 | path | string |  |  |  |  |  |  |
            |  | validations.0 | tag | string |  |  |  |  |  |  |
            |  | validations.0 | param | string |  |  |  |  |  |  |
            |  | validations.0 | value | string |  |  |  |  |  |  |
            |  | validations.0 | message | string |  |  |  |  |  |  |

            #### status-code

            | code | object | name | type | omitempty | properties | description | example | default | enum |
            | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
            | 500 |  | code | object |  |  |  |  |  |  |
            |  |  | type | string |  |  | error 400 |  |  |  |
            |  |  | message | string |  |  |  | 400 |  |  |
            |  |  | user_title | string |  |  |  |  |  |  |
            |  |  | user_message | string |  |  |  |  |  |  |
            |  |  | details | array |  |  |  |  |  |  |
            |  | details.0 | message | string |  |  |  |  |  |  |
            |  | details.0 | user_title | string |  |  |  |  |  |  |
            |  | details.0 | user_message | string |  |  |  |  |  |  |
            |  |  | validations | array |  |  |  |  |  |  |
            |  | validations.0 | field | string |  |  |  |  |  |  |
            |  | validations.0 | path | string |  |  |  |  |  |  |
            |  | validations.0 | tag | string |  |  |  |  |  |  |
            |  | validations.0 | param | string |  |  |  |  |  |  |
            |  | validations.0 | value | string |  |  |  |  |  |  |
            |  | validations.0 | message | string |  |  |  |  |  |  |
        ```
