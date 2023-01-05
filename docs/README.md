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

    1 descriptions
        พิมพ์คำอธิบายที่ต้องการของ request แทนที่คำ `descriptions`

    2 params-postman-to-openapi
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

    3 body-postman-to-openapi

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

    4 response-postman-to-openapi
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

        - request
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


        - response (ต้องมี data{} )
        ```
            {
                "meta": {
                    "code": "200",
                    "type": "OK",
                    "message": "The request was successfully processed.",
                    "error": [
                        {
                            "path": "",
                            "info": ""
                        }
                    ]
                },
                "data": {
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
            | owner | name | string | false |  |  |  |  |  |  |  |
            | owner | age | integer | false |  |  |  |  |  |  |  |
            | owner | address | object | false |  |  |  |  |  |  |  |
            | owner.adress | address_1 | string | false |  |  |  |  |  |  |  |
            | owner.adress | city | string | false |  |  |  |  |  |  |  |
            | owner.adress | country | string | false |  |  |  |  |  |  |  |
            |  | alive | boolean | false |  |  |  |  |  |  |  |

            '# response-postman-to-openapi

            | code | object | name | type | omitempty | properties | description | example | default | enum |
            | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
            | 201 |  | meta | object |  |  |  |  |  |  |
            |  | meta | code | string |  |  |  |  |  |  |
            |  | meta | type | string |  |  |  |  |  |  |
            |  | meta | errors | array |  |  |  |  |  |  |
            |  | meta.errors | path | string |  |  |  |  |  |  |
            |  | meta.errors | info | string |  |  |  |  |  |  |
            |  |  | data | object |  |  |  |  |  |  |
            |  | data | id | string |  |  |  |  |  |  |
            |  | data | pet | string |  |  |  |  |  |  |
            |  | data | info | object |  |  |  |  |  |  |
            |  | data.info | name | string |  |  |  |  |  |  |
            |  | data.info | age | float |  |  |  |  |  |  |
            |  | data.info | behavior | array |  |  |  |  |  |  |
            |  | data | owner | array |  |  |  |  |  |  |
            |  | data.owner | name | string |  |  |  |  |  |  |
            |  | data.owner | age | integer |  |  |  |  |  |  |
            |  | data.owner | address | object |  |  |  |  |  |  |
            |  | data.owner.address | address_1 | string |  |  |  |  |  |  |
            |  | data.owner.address | city | string |  |  |  |  |  |  |
            |  | data.owner.address | country | string |  |  |  |  |  |  |
            |  | data | alive | boolean |  |  |  |  |  |  |
            |  | data | created_at | string |  |  |  |  |  |  |

            '#### status-code

            | code | object | name | type | omitempty | properties | description | example | default | enum |
            | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
            | 400 |  | meta | object |  |  |  |  |  |  |
            |  | meta | code | string |  |  | error 400 |  |  |  |
            |  | meta | type | string |  |  |  | 400 |  |  |
            |  | meta | errors | array |  |  |  |  |  |  |
            |  | meta.errors | path | string |  |  |  |  |  |  |
            |  | meta.errors | info | string |  |  |  |  |  |  |
            |  |  | data | object |  |  |  |  |  |  |

            '#### status-code

            | code | object | name | type | omitempty | properties | description | example | default | enum |
            | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
            | 500 |  | meta | object |  |  |  |  |  |  |
            |  | meta | code | string |  |  | error 500 |  |  |  |
            |  | meta | type | string |  |  |  | 500 |  |  |
            |  | meta | errors | array |  |  |  |  |  |  |
            |  | meta.errors | path | string |  |  |  |  |  |  |
            |  | meta.errors | info | string |  |  |  |  |  |  |
            |  |  | data | object |  |  |  |  |  |  |
        ```
