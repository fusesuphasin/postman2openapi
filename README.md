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

    | object | name | type | omitempty | properties | description | example | default | enum |
    | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  ```

 - การทำ Markdown
    จาก Prepared ใน 1 request จะมี Header 4 ตัว

    ต้องใส่คำเหล่านี้อยู่ใน `Documentation` ทุกครั้งถ้าต้องการทำ `Markdown`
    (# params-postman-to-openapi)
    (# body-postman-to-openapi)
    (# response-postman-to-openapi)

    1. descriptions
        พิมพ์คำอธิบายที่ต้องการของ request แทนที่คำ `descriptions`

    2. params-postman-to-openapi
        อธิบาย params มี column 10 ตัว
        
        ``` 
        | object | name | type | required | properties | validate | description | example | default | enum |
        ```
        
        **object** : `path`
        **name** : ชื่อ key ของ params 
        **type** : ชื่อ ประเภทข้อมูลของ key ของ params 
        **required** : required key ของ params หรือไม่ `true = required, false = not required`
        **properties** : คุณสมบัติของ key ของ params 
        **validate** : ชื่อ key ของ params `ของ go validator ใช้ทำ gogengo`
        **description** : คำอธิบาย key ของ params 
        **example** : ตัวอย่าง key ของ params 
        **default** : คำอธิบาย key ของ params 
        **enum** : ค่าที่รองรับของ key ของ params 

    3. body-postman-to-openapi

        ```
        | object | name | type | required | omitempty | properties | validate | description | example | default | enum |
        ```

        **object** : path ของ field
        **name** : ชื่อ key ของ field 
        **type** : ชื่อ ประเภทข้อมูลของ key ของ field 
        **required** : required key ของ field หรือไม่ `true = required, false = not required`
        **omitempty** : คุณสมบัติของ key ของ field `ใช้ทำ gogengo true = omitempty, false = not omitempty`
        **properties** : คุณสมบัติของ key ของ field 
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
        **validate** : ชื่อ key ของ field `ของ go validator ใช้ทำ gogengo`
        **description** : คำอธิบาย key ของ field 
        **example** : ตัวอย่าง key ของ field 
        **default** : คำอธิบาย key ของ field 
        **enum** : ค่าที่รองรับของ key ของ field 

    4. response-postman-to-openapi

        ```
        | object | name | type | omitempty | properties | description | example | default | enum |
        ```

        **object** : path ของ field
        **name** : ชื่อ key ของ field 
        **type** : ชื่อ ประเภทข้อมูลของ key ของ field 
        **omitempty** : คุณสมบัติของ key ของ field `ใช้ทำ gogengo true = omitempty, false = not omitempty`
        **properties** : คุณสมบัติของ key ของ field 
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
        **description** : คำอธิบาย key ของ field 
        **example** : ตัวอย่าง key ของ field 
        **default** : คำอธิบาย key ของ field 
        **enum** : ค่าที่รองรับของ key ของ field 

    - Example
        - request url
        ```
        /pet/info/:language
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