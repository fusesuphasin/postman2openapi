'use strict'

const { promises: { writeFile, readFile } } = require('fs')
const { dump } = require('js-yaml')
const { parseMdTable } = require('./md-utils')
const { version } = require('../package.json')
const replacePostmanVariables = require('./var-replacer')
const jsonc = require('jsonc-parser')
const camelCase = require('lodash.camelcase')
const { interfaces } = require('mocha')
const sprintf = require('sprintf-js').sprintf

async function postmanToOpenApi(input, output, {
  info = {}, defaultTag = 'default', pathDepth = 0,
  auth: optsAuth, servers, externalDocs = {}, folders = {},
  responseHeaders = true, replaceVars = true, additionalVars = {}, outputFormat = 'yaml',
  disabledParams = { includeQuery: false, includeHeader: true }, operationId = 'off'
} = {}) {
  // TODO validate?
  let collectionFile = await resolveInput(input)
  if (replaceVars) {
    collectionFile = replacePostmanVariables(collectionFile, additionalVars)
  }
  const _postmanJson = JSON.parse(collectionFile)
  const postmanJson = _postmanJson.collection || _postmanJson
  const { item: items, variable = [] } = postmanJson
  const paths = {}
  const domains = new Set()
  const tags = {}
  const tagsG = {}
  const securitySchemes = {}
  let tagGroup = {}
  let obj = {};
  let count = 0
  let prevTag = ""

  for (let [i, element] of items.entries()) {
    while (element != null && element.item != null) { // is a folder
      let { item, description: tagDesc } = element
      let tag = calculateFolderTag(element, folders)
      let key = tag.split(" > ")
      let group = ""
      let newTag = ""

      for (let i = 0; i < key.length; i++) {
        if (i == 0) {
          group = key[i]
        } else if (i == 1) {
          newTag += key[i]
        } else {
          newTag += " > " + key[i]
        }
      }
      //newTag = newTag.replace(newTagPrev, "");

      if (newTag === "") {
        newTag = group
        group = ""
      }

      if (obj[key[0]] == undefined) {
        obj[key[0]] = []
      }

      let checkHead = newTag.split(" > ")
      if (checkHead.length == 1 && checkHead[0] != "") {
        prevTag = newTag
      }
      let result = newTag.indexOf(prevTag);
      if (result == 1) {
        newTag = newTag.replace(newTagPrev, "");
        newTag = ""

        for (let index = 1; index < checkHead.length; index++) {
          newTag += " > " + key[i]
        }
      }


      obj[key[0]].push(newTag)

      let tagged = item.map(e => ({ ...e, tag }))

      tags[newTag] = tagDesc
      tagsG[tag] = tagDesc

      items.splice(i, 1, ...tagged)
      // Empty folders will have tagged empty
      element = (tagged.length > 0) ? tagged.shift() : items[i]
    }

    // If there are an empty folder at the end of the collection elements could be `undefined`
    if (element != null) {
      const {
        request: { url, method, body, description: rawDesc, header = [], auth },
        name, tag = defaultTag, event: events, response
      } = element
      const { path, query, protocol, host, port, valid, pathVars } = scrapeURL(url)
      if (valid) {
        // Remove from name the possible operation id between brackets
        // eslint-disable-next-line no-useless-escape
        const summary = name.replace(/ \[([^\[\]]*)\]/gi, '')
        domains.add(calculateDomains(protocol, host, port))
        const joinedPath = calculatePath(path, pathDepth)

        if (!paths[joinedPath]) paths[joinedPath] = {}
        const { description, headersMeta, queryMeta, pathMeta, bodyMeta, responseMeta } = descriptionParse(rawDesc)
        let key = tag.split(" > ")
        let group = ""
        let newTag = ""
        for (let i = 0; i < key.length; i++) {
          if (i == 0) {
            group = key[i]
          } else if (i == 1) {
            newTag += key[i]
          } else {
            newTag += " > " + key[i]
          }
        }
        if (newTag === "") {
          newTag = group
          group = ""
        }
        console.log(path)
        console.log(rawDesc)
        paths[joinedPath][method.toLowerCase()] = {
          tags: [newTag],
          summary,
          ...(calculateOperationId(operationId, name, summary)),
          ...(description ? { description } : {}),
          ...parseBody(body, method, bodyMeta),
          ...parseOperationAuth(auth, securitySchemes, optsAuth),
          ...parseParameters(query, header, joinedPath, headersMeta, queryMeta, pathMeta, pathVars, disabledParams),
          ...parseResponse(response, events, responseHeaders, responseMeta)
        }

      }
    }

  }

  const openApi = {
    openapi: '3.0.0',
    info: compileInfo(postmanJson, info),
    ...parseExternalDocs(variable, externalDocs),
    ...parseServers(domains, servers),
    ...parseAuth(postmanJson, optsAuth, securitySchemes),
    ...parseTags(tags),
    ...parseGroupTags(tagsG),
    paths
  }

  const openApiDoc = outputFormat === 'json' ? JSON.stringify(openApi, null, 4) : dump(openApi, { skipInvalid: true })
  if (output != null) {
    await writeFile(output, openApiDoc, 'utf8')
  }
  return openApiDoc
}

/* Calculate the tags for folders items based on the options */
function calculateFolderTag({ tag, name }, { separator = ' > ', concat = true }) {
  let path = ""
  path = (tag && concat) ? `${tag}${separator}${name}` : name
  /* 
    let getpath = path
    let newTag = ""
    let key = getpath.split("-")
    let group = ""
  
    for (let i = 0; i < key.length; i++) {
      if (i == 0) {
        group = key[i]
      } else {
        newTag += key[i] + (i == 1 ? "" : " > ");
      }
    }
    name = group + "//" + newTag */

  return path
}

function compileInfo(postmanJson, optsInfo) {
  const { info: { name, description: desc }, variable = [] } = postmanJson
  const ver = getVarValue(variable, 'version', '1.0.0')
  const {
    title = name, description = desc, version = ver,
    termsOfService, license, contact, xLogo
  } = optsInfo
  return {
    title,
    description,
    version,
    ...parseXLogo(variable, xLogo),
    ...(termsOfService ? { termsOfService } : {}),
    ...parseContact(variable, contact),
    ...parseLicense(variable, license)
  }
}

function parseXLogo(variables, xLogo = {}) {
  const urlVar = getVarValue(variables, 'x-logo.urlVar')
  const backgroundColorVar = getVarValue(variables, 'x-logo.backgroundColorVar')
  const altTextVar = getVarValue(variables, 'x-logo.altTextVar')
  const hrefVar = getVarValue(variables, 'x-logo.hrefVar')
  const {
    url = urlVar, backgroundColor = backgroundColorVar,
    altText = altTextVar, href = hrefVar
  } = xLogo
  return (url != null) ? { 'x-logo': { url, backgroundColor, altText, href } } : {}
}

function parseLicense(variables, optsLicense = {}) {
  const nameVar = getVarValue(variables, 'license.name')
  const urlVar = getVarValue(variables, 'license.url')
  const { name = nameVar, url = urlVar } = optsLicense
  return (name != null) ? { license: { name, ...(url ? { url } : {}) } } : {}
}

function parseContact(variables, optsContact = {}) {
  const nameVar = getVarValue(variables, 'contact.name')
  const urlVar = getVarValue(variables, 'contact.url')
  const emailVar = getVarValue(variables, 'contact.email')
  const { name = nameVar, url = urlVar, email = emailVar } = optsContact
  return [name, url, email].some(e => e != null)
    ? {
      contact: {
        ...(name ? { name } : {}),
        ...(url ? { url } : {}),
        ...(email ? { email } : {})
      }
    }
    : {}
}

function parseExternalDocs(variables, optsExternalDocs) {
  const descriptionVar = getVarValue(variables, 'externalDocs.description')
  const urlVar = getVarValue(variables, 'externalDocs.url')
  const { description = descriptionVar, url = urlVar } = optsExternalDocs
  return (url != null) ? { externalDocs: { url, ...(description ? { description } : {}) } } : {}
}

function parseBody(body = {}, method, bodyMeta) {

  // Swagger validation return an error if GET has body
  if (['GET', 'DELETE'].includes(method)) return {}
  const { mode, raw, options = { raw } } = body
  let content = {}
  switch (mode) {
    case 'raw': {
      const { raw: { language } } = options

      let example = ''
      if (language === 'json') {
        if (raw) {
          const errors = []
          example = jsonc.parse(raw, errors)
          if (errors.length > 0) {
            example
          }
        }
        content = {
          'application/json': parseBodyData(example, bodyMeta),

        }
      } else if (language === 'text') {
        content = {
          'text/plain': {
            schema: {
              type: 'string',
              example: raw
            }
          }
        }
      } else {
        content = {
          '*/*': {
            schema: {
              type: 'string',
              // To protect from object types we always stringify this
              example: JSON.stringify(raw)
            }
          }
        }
      }
      break
    }
    case 'file':
      content = {
        'text/plain': {}
      }
      break
    case 'formdata': {

      content = {
        'multipart/form-data': parseFormData(body.formdata, bodyMeta)
      }
      break
    }
    case 'urlencoded':
      content = {
        'application/x-www-form-urlencoded': parseFormData(body.urlencoded)
      }
      break
  }
  return { requestBody: { content } }
}

function parseBodyData(data, bodyMeta) {
  const objectSchema = {
    schema: {
      type: 'object',
      required: [],
      example: data,
      properties: {
      }
    }
  }

  let allKeys = Object.keys(data);

  let pathdata = getAllKeyPaths(data)

  let path = ""

  for (const val of allKeys) {
    const object1 = Object.keys(data[val]);


    for (var p of pathdata) {

      let splitP = p.split(".")
      if (splitP[splitP.length - 1] === val && bodyMeta != undefined) {
        path = p
        pathdata = pathdata.filter(item => item !== path);

        const properties = extractBody(bodyMeta[path])
        // requried
        if (bodyMeta[path] != undefined) {
          if (bodyMeta[path].required == "true") {
            objectSchema.schema.required.push(bodyMeta[path].name)
          }
        }

        if (properties.type == 'array') {
          //array
          let name = bodyMeta[path].name

          var object1Schema = nestedObject(bodyMeta, data[val][0], pathdata, path)

          if (((bodyMeta[object1[0]]) === undefined), Array.isArray(data[val]), typeof data[val][0] === "string") {
            properties.type = "Array of strings"
          }
          objectSchema.schema.properties[name] = {
            type: properties.type,
            default: properties.default,
            description: properties.description,
            items: object1Schema,
          }
          delete bodyMeta[path]
          break

        } else if (properties.type == "object") {
          let name = bodyMeta[path].name

          //object
          var object1Schema = nestedObject(bodyMeta, data[val], pathdata, path)

          objectSchema.schema.properties[name] = {
            type: properties.type,
            default: properties.default,
            description: properties.description,
            allOf: [object1Schema]
          }
          delete bodyMeta[path]
          break

        }
        else {
          if (bodyMeta[path] != undefined) {
            objectSchema.schema.properties[bodyMeta[path].name] = properties

            delete bodyMeta[path]
            break
          }
        }
      }
    }
  }
  return objectSchema
}

function parseRespData(bodies, language, data) {

  const example = parseExamples(bodies, language, data)
  const bodyMeta = data
  const newData = example.example

  let pathdata = getAllKeyPaths(newData)

  let path = ""

  const objectSchema = {
    schema: {
      type: 'object',
      required: [],
      example: example.example,
      properties: {
      }
    }
  }
  const allKeys = Object.keys(newData);

  for (const val of allKeys) {
    const object1 = Object.keys(newData[val]);
    for (const p of pathdata) {

      let splitP = p.split(".")

      if (splitP[splitP.length - 1] === val && bodyMeta != undefined) {

        path = p
        pathdata = pathdata.filter(item => item !== path);

        const properties = extractBody(bodyMeta[path])

        if (properties.type == 'array') {
          //array
          let name = bodyMeta[path].name

          var object1Schema = nestedObject(bodyMeta, newData[val][0], pathdata, path)

          if (((bodyMeta[object1[0]]) === undefined), Array.isArray(newData[val]), typeof newData[val][0] === "string") {
            properties.type = "Array of strings"
          }
          objectSchema.schema.properties[name] = {
            type: properties.type,
            default: properties.default,
            description: properties.description,
            items: object1Schema,
          }
          delete bodyMeta[path]
          break

        } else if (properties.type == "object") {
          let name = bodyMeta[path].name

          //object
          var object1Schema = nestedObject(bodyMeta, newData[val], pathdata, path)

          objectSchema.schema.properties[name] = {
            type: properties.type,
            default: properties.default,
            description: properties.description,
            allOf: [object1Schema]
          }
          delete bodyMeta[path]
          break

        } else {
          if (bodyMeta[path] != undefined) {
            objectSchema.schema.properties[bodyMeta[path].name] = properties

            delete bodyMeta[path]
            break
          }

        }

      }
    }

  }

  return objectSchema
}

function nestedObject(bodyMeta, data, pathdata, path) {
  // delete bodyMeta[path]
  const objectSchema = {
    required: [],
    properties: {},
  }
  let allKeys = []
  if (data != undefined) {
    allKeys = Object.keys(data);
  }

  for (var val of allKeys) {
    let _type = data[val]
    if (_type !== undefined && _type !== null) {
      var object2 = Object.keys(_type);
    }

    for (var p of pathdata) {
      let splitP = p.split(".")
      if (splitP[splitP.length - 1] === val) {
        path = p
        pathdata = pathdata.filter(item => item !== path);

        // requried
        if (bodyMeta[path] != undefined) {
          if (bodyMeta[path].required == "true") {
            objectSchema.required.push(bodyMeta[path].name)
          }
        }

        var properties = extractBody(bodyMeta[path])

        if (properties.type == 'array') {
          //array
          let name = bodyMeta[path].name

          var object1Schema = nestedObject(bodyMeta, data[val][0], pathdata, path)

          if (((bodyMeta[object2[0]]) === undefined), Array.isArray(data[val]), typeof data[val][0] === "string") {
            properties.type = "Array of strings"
          }
          objectSchema.properties[name] = {
            type: properties.type,
            default: properties.default,
            description: properties.description,
            items: object1Schema,
          }
          delete bodyMeta[path]
          break

        } else if (properties.type == "object") {
          let name = bodyMeta[path].name

          //object
          var object1Schema = nestedObject(bodyMeta, data[val], pathdata, path)

          objectSchema.properties[name] = {
            type: properties.type,
            default: properties.default,
            description: properties.description,
            allOf: [object1Schema],
          }
          delete bodyMeta[path]
          break

        } else if (bodyMeta[path] != undefined) {
          objectSchema.properties[bodyMeta[path].name] = properties
          delete bodyMeta[path]
          break
        }
      }
    }
  }

  return objectSchema
}

function getAllKeyPaths(obj, parentKey = '') {
  let paths = [];
  for (const k in obj) {
    const key = parentKey ? `${parentKey}.${k}` : k;
    if (typeof obj[k] === 'object') {
      paths.push(key);  // push the current key to paths
      paths.push(...getAllKeyPaths(obj[k], key));
    } else {
      paths.push(key);
    }
  }

  paths = [...new Set(paths)]
  return paths;
}


function extractBody(body) {

  var title = ""
  var multipleOf = ""
  var maximum = ""
  var exclusiveMaximum = ""
  var minimum = ""
  var exclusiveMinimum = ""
  var maxLength = ""
  var minLength = ""
  var pattern = ""
  var maxItems = ""
  var minItems = ""
  var uniqueItems = ""
  var maxProperties = ""
  var minProperties = ""
  var desc = ""
  var enum_ = []

  if (body != undefined) {

    if (body.example != "") {
      desc = sprintf("%s \n\n Example: %s", body.description, body.example);
    } else {
      desc = sprintf("%s \n", body.description);
    }

    if (body.enum != "" && body.enum != undefined) {
      let splitEnum = body.enum.split(",")
      for (const s of splitEnum) {
        enum_.push(s)
      }
    }

    if (body.properties != "" && body.properties != undefined) {

      let splitproperties = body.properties.split(",")
      for (const s of splitproperties) {
        if (s.indexOf("title") !== -1) {
          let value = s.split("=")
          title = value[value.length - 1]
        }

        if (s.indexOf("minimum") !== -1) {
          let value = s.split("=")
          minimum = value[value.length - 1]
        }

        if (s.indexOf("maximum") !== -1) {
          let value = s.split("=")
          maximum = value[value.length - 1]
        }

        if (s.indexOf("pattern") !== -1) {
          let value = s.split("=")
          pattern = " regex = " + "\"" + value[value.length - 1] + "\""
        }

        if (s.indexOf("multipleOf") !== -1) {
          let value = s.split("=")
          multipleOf = value[value.length - 1]
        }

        if (s.indexOf("exclusiveMaximum") !== -1) {
          let value = s.split("=")
          exclusiveMaximum = value[value.length - 1]
        }

        if (s.indexOf("exclusiveMinimum") !== -1) {
          let value = s.split("=")
          exclusiveMinimum = value[value.length - 1]
        }

        if (s.indexOf("maxLength") !== -1) {
          let value = s.split("=")
          maxLength = value[value.length - 1]
        }

        if (s.indexOf("minLength") !== -1) {
          let value = s.split("=")
          minLength = value[value.length - 1]
        }

        if (s.indexOf("maxItems") !== -1) {
          let value = s.split("=")
          maxItems = value[value.length - 1]
        }

        if (s.indexOf("minItems") !== -1) {
          let value = s.split("=")
          minItems = value[value.length - 1]
        }

        if (s.indexOf("uniqueItems") !== -1) {
          let value = s.split("=")
          uniqueItems = value[value.length - 1]
        }

        if (s.indexOf("maxProperties") !== -1) {
          let value = s.split("=")
          maxProperties = value[value.length - 1]
        }

        if (s.indexOf("minProperties") !== -1) {
          let value = s.split("=")
          minProperties = value[value.length - 1]
        }
      }
    }
    return {
      ...(body.description ? { description: desc } : {}),
      ...(body.type ? { type: body.type } : {}),
      ...(body.default ? { default: body.default } : {}),
      ...(body.enum ? { enum: enum_ } : {}),
      ...(pattern ? { pattern: pattern } : {}),
      ...(minimum ? { minimum: minimum } : {}),
      ...(maximum ? { maximum: maximum } : {}),
      ...(minLength ? { minLength: minLength } : {}),
      ...(maxLength ? { maxLength: maxLength } : {}),
      ...(exclusiveMinimum ? { exclusiveMinimum: exclusiveMinimum } : {}),
      ...(exclusiveMaximum ? { exclusiveMaximum: exclusiveMaximum } : {}),
      ...(uniqueItems ? { uniqueItems: uniqueItems } : {}),
      ...(title ? { title: title } : {}),
      ...(multipleOf ? { multipleOf: multipleOf } : {}),
      ...(maxItems ? { maxItems: maxItems } : {}),
      ...(minItems ? { minItems: minItems } : {}),
      ...(maxProperties ? { maxProperties: maxProperties } : {}),
      ...(minProperties ? { minProperties: minProperties } : {}),
      ...(body.example ? { example: body.example } : {}),
    }
  }

  return {}
}

function extractPath(body) {

  var title = ""
  var multipleOf = ""
  var maximum = ""
  var exclusiveMaximum = ""
  var minimum = ""
  var exclusiveMinimum = ""
  var maxLength = ""
  var minLength = ""
  var pattern = ""
  var maxItems = ""
  var minItems = ""
  var uniqueItems = ""
  var maxProperties = ""
  var minProperties = ""
  var desc = ""
  var enum_ = []

  if (body != undefined) {
    desc = sprintf("%s", body.description);

    if (body.enum != "" && body.enum != undefined) {
      let splitEnum = body.enum.split(",")
      for (const s of splitEnum) {
        enum_.push(s)
      }
    }

    if (body.properties != "" && body.properties != undefined) {

      let splitproperties = body.properties.split(",")
      for (const s of splitproperties) {
        if (s.indexOf("title") !== -1) {
          let value = s.split("=")
          title = value[value.length - 1]
        }

        if (s.indexOf("minimum") !== -1) {
          let value = s.split("=")
          minimum = value[value.length - 1]
        }

        if (s.indexOf("maximum") !== -1) {
          let value = s.split("=")
          maximum = value[value.length - 1]
        }

        if (s.indexOf("pattern") !== -1) {
          let value = s.split("=")
          pattern = " regex = " + "\"" + value[value.length - 1] + "\""
        }

        if (s.indexOf("multipleOf") !== -1) {
          let value = s.split("=")
          multipleOf = value[value.length - 1]
        }

        if (s.indexOf("exclusiveMaximum") !== -1) {
          let value = s.split("=")
          exclusiveMaximum = value[value.length - 1]
        }

        if (s.indexOf("exclusiveMinimum") !== -1) {
          let value = s.split("=")
          exclusiveMinimum = value[value.length - 1]
        }

        if (s.indexOf("maxLength") !== -1) {
          let value = s.split("=")
          maxLength = value[value.length - 1]
        }

        if (s.indexOf("minLength") !== -1) {
          let value = s.split("=")
          minLength = value[value.length - 1]
        }

        if (s.indexOf("maxItems") !== -1) {
          let value = s.split("=")
          maxItems = value[value.length - 1]
        }

        if (s.indexOf("minItems") !== -1) {
          let value = s.split("=")
          minItems = value[value.length - 1]
        }

        if (s.indexOf("uniqueItems") !== -1) {
          let value = s.split("=")
          uniqueItems = value[value.length - 1]
        }

        if (s.indexOf("maxProperties") !== -1) {
          let value = s.split("=")
          maxProperties = value[value.length - 1]
        }

        if (s.indexOf("minProperties") !== -1) {
          let value = s.split("=")
          minProperties = value[value.length - 1]
        }
      }
    }

    return {
      ...(body.required ? { required: body.required } : {}),
      ...(body.description ? { description: desc } : {}),
      ...(body.type ? { type: body.type } : {}),
      ...(body.default ? { default: body.default } : {}),
      ...(body.enum ? { enum: enum_ } : {}),
      ...(pattern ? { pattern: pattern } : {}),
      ...(minimum ? { minimum: minimum } : {}),
      ...(maximum ? { maximum: maximum } : {}),
      ...(minLength ? { minLength: minLength } : {}),
      ...(maxLength ? { maxLength: maxLength } : {}),
      ...(exclusiveMinimum ? { exclusiveMinimum: exclusiveMinimum } : {}),
      ...(exclusiveMaximum ? { exclusiveMaximum: exclusiveMaximum } : {}),
      ...(uniqueItems ? { uniqueItems: uniqueItems } : {}),
      ...(title ? { title: title } : {}),
      ...(multipleOf ? { multipleOf: multipleOf } : {}),
      ...(maxItems ? { maxItems: maxItems } : {}),
      ...(minItems ? { minItems: minItems } : {}),
      ...(maxProperties ? { maxProperties: maxProperties } : {}),
      ...(minProperties ? { minProperties: minProperties } : {}),
      ...(body.example ? { example: body.example } : {}),
    }
  }

  return {}
}


/** Parse the body for create a form data structure */
function parseFormData(data, bodyDes) {
  const objectSchema = {
    schema: {
      type: 'object',
      required: [],
      example: data[0],
      properties: {
      }
    }
  }

  return data.reduce((obj, { key, type, description, value }) => {
    let body = bodyDes[key]
    let properties = {}
    properties = extractPath(body)
    console.log(body)
    if (body.required == "true") {
      objectSchema.schema.required.push(body.name)
    }
    const { schema } = obj
    if (isRequired(description)) {


      // (schema.required = schema.required || []).push(key)
    }
    let required = false
    if (properties["required"] === "true") {
      required = true
    }
    (schema.properties = schema.properties || {})[key] = {
      type: properties.type,
      default: properties.default,
      description: properties.description,
    }
    return obj
  }, objectSchema)

}

/**
 * Default logic to insert parameters, if parameter exist will not be inserted again.
 * In Postman this means that only the first parameter is used, the repeated ones are discarded.
 * This is a separated method to allow make it configurable in the future
 * @param {Map} parameterMap
 * @param {Object} param
 * @returns the modified parameterMap
 */
const defaultParamInserter = (parameterMap, param) => {
  if (!parameterMap.has(param.name)) {
    parameterMap.set(param.name, param)
  }
  return parameterMap
}

/* Parse the Postman query and header and transform into OpenApi parameters */
function parseParameters(query, header, paths, headersMeta, queryMeta, pathMeta = {}, pathVars,
  { includeQuery = false, includeHeader = false }, paramInserter = defaultParamInserter) {

  // parse Headers
  const parameters = [...header.reduce(mapParameters('header', includeHeader, paramInserter, headersMeta), new Map()).values()]
  // parse Query
  parameters.push(...query.reduce(mapParameters('query', includeQuery, paramInserter, queryMeta), new Map()).values())
  // Path params
  parameters.push(...extractPathParameters(paths, pathMeta, pathVars))
  return (parameters.length) ? { parameters } : {}
}

/* Accumulator function for different types of parameters */
function mapParameters(type, includeDisabled, paramInserter, Meta) {
  return (parameterMap, { key, description, value, disabled }) => {
    if (!includeDisabled && disabled === true) return parameterMap
    //const required = /\[required\]/gi.test(description)
    let properties = {}
    /*  console.log(paramInserter)
     console.log(type)
     console.log(Meta)
     console.log(key)
     console.log(Meta[key])
     console.log("____________________________") */
    properties = extractPath(Meta[key])

    let required = false
    if (properties["required"] === "true") {
      required = true
    }
    paramInserter(parameterMap, {
      name: key,
      in: type,
      schema: {
        ...(properties['type'] ? { type: properties['type'] } : {}),
        ...(properties['default'] ? { default: properties['default'] } : {}),
        ...(properties['enum'] ? { enum: properties['enum'] } : {}),
        ...(properties['pattern'] ? { pattern: properties['pattern'] } : {}),
        ...(properties['minimum'] ? { minimum: properties['minimum'] } : {}),
        ...(properties['maximum'] ? { maximum: properties['maximum'] } : {}),
        ...(properties['minLength'] ? { minLength: properties['minLength'] } : {}),
        ...(properties['maxLength'] ? { maxLength: properties['maxLength'] } : {}),
        ...(properties['exclusiveMinimum'] ? { exclusiveMinimum: properties['exclusiveMinimum'] } : {}),
        ...(properties['exclusiveMaximum'] ? { exclusiveMaximum: properties['exclusiveMaximum'] } : {}),
        ...(properties['exclusiveMaximum'] ? { uniqueItems: properties['exclusiveMaximum'] } : {}),
        ...(properties['title'] ? { title: properties['title'] } : {}),
        ...(properties['multipleOf'] ? { multipleOf: properties['multipleOf'] } : {}),
        ...(properties['maxItems'] ? { maxItems: properties['maxItems'] } : {}),
        ...(properties['minItems'] ? { minItems: properties['minItems'] } : {}),
        ...(properties['maxProperties'] ? { maxProperties: properties['maxProperties'] } : {}),
        ...(properties['minProperties'] ? { minProperties: properties['minProperties'] } : {}),
      },
      ...(required ? { required } : {}),
      ...(properties['description'] ? { description: properties['description'] } : {}),
      ...(properties['example'] ? { example: properties['example'] } : {})
    })
    return parameterMap
  }
}

function extractPathParameters(path, pathMeta, pathVars) {
  const matched = path.match(/{\s*[\w-]+\s*}/g) || []
  return matched.map(match => {
    const name = match.slice(1, -1)
    const { type: varType = 'string', description: desc, value } = pathVars[name] || {}
    const { type = varType, description = desc, example = value } = pathMeta[name] || {}

    const properties = extractPath(pathMeta[name])

    let required = false
    if (properties["required"] === "true") {
      required = true
    }

    return {
      name,
      in: 'path',
      schema: {
        ...(properties['type'] ? { type: properties['type'] } : {}),
        ...(properties['default'] ? { default: properties['default'] } : {}),
        ...(properties['enum'] ? { enum: properties['enum'] } : {}),
        ...(properties['pattern'] ? { pattern: properties['pattern'] } : {}),
        ...(properties['minimum'] ? { minimum: properties['minimum'] } : {}),
        ...(properties['maximum'] ? { maximum: properties['maximum'] } : {}),
        ...(properties['minLength'] ? { minLength: properties['minLength'] } : {}),
        ...(properties['maxLength'] ? { maxLength: properties['maxLength'] } : {}),
        ...(properties['exclusiveMinimum'] ? { exclusiveMinimum: properties['exclusiveMinimum'] } : {}),
        ...(properties['exclusiveMaximum'] ? { exclusiveMaximum: properties['exclusiveMaximum'] } : {}),
        ...(properties['exclusiveMaximum'] ? { uniqueItems: properties['exclusiveMaximum'] } : {}),
        ...(properties['title'] ? { title: properties['title'] } : {}),
        ...(properties['multipleOf'] ? { multipleOf: properties['multipleOf'] } : {}),
        ...(properties['maxItems'] ? { maxItems: properties['maxItems'] } : {}),
        ...(properties['minItems'] ? { minItems: properties['minItems'] } : {}),
        ...(properties['maxProperties'] ? { maxProperties: properties['maxProperties'] } : {}),
        ...(properties['minProperties'] ? { minProperties: properties['minProperties'] } : {}),
      },
      ...(required ? { required } : {}),
      ...(properties['description'] ? { description: properties['description'] } : {}),
      ...(properties['example'] ? { example: properties['example'] } : {})
    }
  })
}

function getVarValue(variables, name, def = undefined) {
  const variable = variables.find(({ key }) => key === name)
  return variable ? variable.value : def
}

/* calculate the type of a variable based on OPenApi types */
function inferType(value) {
  if (/^\d+$/.test(value)) return 'integer'
  if (/^[+-]?([0-9]*[.])?[0-9]+$/.test(value)) return 'number'
  if (/^(true|false)$/.test(value)) return 'boolean'
  return 'string'
}

/* Calculate the global auth based on options and postman definition */
function parseAuth({ auth }, optAuth, securitySchemes) {
  if (optAuth != null) {
    return parseOptsAuth(optAuth)
  }
  return parsePostmanAuth(auth, securitySchemes)
}

/* Parse a postman auth definition */
function parsePostmanAuth(postmanAuth = {}, securitySchemes) {
  const { type } = postmanAuth
  if (type != null) {
    securitySchemes[`${type}Auth`] = {
      type: 'http',
      scheme: type
    }
    return {
      components: { securitySchemes },
      security: [{
        [`${type}Auth`]: []
      }]
    }
  }
  return (Object.keys(securitySchemes).length === 0) ? {} : { components: { securitySchemes } }
}

/* Parse Auth at operation/request level */
function parseOperationAuth(auth, securitySchemes, optsAuth) {
  if (auth == null || optsAuth != null) {
    // In case of config auth operation auth is disabled
    return {}
  } else {
    const { type } = auth
    securitySchemes[`${type}Auth`] = {
      type: 'http',
      scheme: type
    }
    return {
      security: [{ [`${type}Auth`]: [] }]
    }
  }
}

/* Parse a options global auth */
function parseOptsAuth(optAuth) {
  const securitySchemes = {}
  const security = []
  for (const [secName, secDefinition] of Object.entries(optAuth)) {
    const { type, scheme, ...rest } = secDefinition
    if (type === 'http' && ['bearer', 'basic'].includes(scheme)) {
      securitySchemes[secName] = {
        type: 'http',
        scheme,
        ...rest
      }
      security.push({ [secName]: [] })
    }
  }
  return Object.keys(securitySchemes).length === 0
    ? {}
    : {
      components: { securitySchemes },
      security
    }
}

/* From the path array compose the real path for OpenApi specs */
function calculatePath(paths, pathDepth) {
  paths = paths.slice(pathDepth) // path depth
  // replace repeated '{' and '}' chars
  // replace `:` chars at first
  return '/' + paths.map(path => {
    path = path.replace(/([{}])\1+/g, '$1')
    path = path.replace(/^:(.*)/g, '{$1}')
    return path
  }).join('/')
}

function calculateDomains(protocol, hosts, port) {
  return protocol + '://' + hosts.join('.') + (port ? `:${port}` : '')
}

/**
 * To support postman collection v2 and variable replace we should parse the `url` or `url.raw` data
 * without trust in the object as in v2 could not exist and if replaceVars = true then values cannot
 * be correctly parsed
 * @param {Object | String} url
 * @returns a url structure as in postman v2.1 collections
 */
function scrapeURL(url) {
  // Avoid parse empty url request
  if (url === undefined || url === '' || url.raw === '') {
    return { valid: false }
  }
  const rawUrl = (typeof url === 'string' || url instanceof String) ? url : url.raw
  // Fix for issue #136 if replace vars are not used then new URL throw an error
  // when using variables before the schema
  const fixedUrl = (rawUrl.startsWith('{{')) ? 'http://' + rawUrl : rawUrl
  const objUrl = new URL(fixedUrl)

  return {
    raw: rawUrl,
    path: decodeURIComponent(objUrl.pathname).slice(1).split('/'),
    query: compoundQueryParams(objUrl.searchParams, url.query),
    protocol: objUrl.protocol.slice(0, -1),
    host: decodeURIComponent(objUrl.hostname).split('.'),
    port: objUrl.port,
    valid: true,
    pathVars: (url.variable == null)
      ? {}
      : url.variable.reduce((obj, { key, value, description }) => {
        obj[key] = { value, description, type: inferType(value) }
        return obj
      }, {})
  }
}

/**
 * Calculate query parameters in postman collection
 * @param {*} searchParams The searchParam instance from an URL object
 * @param {*} queryCollection The postman collection query section
 * @returns A query params array as created by postman collections Array(Obj)
 *
 * NOTE: This method was created because we think that some versions of postman don´t add the `query`
 * parameter in the url, but after some reasearch the reason why the `query` parameter can not be
 * present is just because no query parameters are used so we just format the postman `query` array here.
 */
function compoundQueryParams(searchParams, queryCollection = []) {
  return queryCollection
}

/* Parse domains from operations or options */
function parseServers(domains, serversOpts) {
  let servers
  if (serversOpts != null) {
    // This map is just to filter not supported fields while no validations are implemented
    servers = serversOpts.map(({ url, description }) => ({ url, description }))
  } else {
    servers = Array.from(domains).map(domain => ({ url: domain }))
  }
  return (servers.length > 0) ? { servers } : {}
}

/* Transform a object of tags in an array of tags */
function parseTags(tagsObj) {
  const tags = Object.entries(tagsObj)
    .map(([name, description]) => ({ name, description }))

  return (tags.length > 0) ? { tags } : {}
}

/* Transform a object of tags in an array of tags */
function parseGroupTags(tagsObj) {
  let result = [];

  Object.keys(tagsObj).forEach(key => {
    let splitKey = key.split(" > ");
    let name = splitKey[0];
    let tags = splitKey.slice(1,);

    let existing = result.find(r => r.name === name);

    if (!existing) {

      if (tags == "") {
        tags = [name]
      }
      result.push({ name: name, tags: tags });

    } else {

      existing.tags.push(tags.join(" > "));
    }
  });

  return { "x-tagGroups": result }

  /* let tags = ""
  let tag = []
  let groupname = ""
  for (let index = 0; index < array.length; index++) {
    const element = array[index];
    
  }
  const tagsValue = Object.entries(tagsObj)
    .map(([name, description]) => (
      tag = name.split(" > "),
      name = tag[0],
      { name, tags })
    )

  return (tagsValue.length > 0) ? { "x-tagGroups": tagsValue } : {} */

  /* const tags = Object.entries(tagsObj)
    .map(([name, description]) => ({ name, description }))
  return (tags.length > 0) ? { tags } : {} */
}

function descriptionParse(description) {
  if (description == null) return { description }
  const splitDesc = description.split(/# headers-postman-to-openapi/gi)
  if (splitDesc.length === 1) return { description }
  const splitDesc2 = splitDesc[1].split(/# query-postman-to-openapi/gi)
  const splitDesc3 = splitDesc2[1].split(/# path-postman-to-openapi/gi)
  const splitDesc4 = splitDesc3[1].split(/# body-postman-to-openapi/gi)
  const splitDesc5 = splitDesc4[1].split(/# response-postman-to-openapi/gi)
  /*  console.log(description)
   console.log("_____________________________________________")
  */
  console.log("_____________________________________________", splitDesc5)
  const splitDesc6 = splitDesc5[1].split(/#### status-code/gi)

  let resp = {}
  for (const s of splitDesc6) {
    resp = Object.assign(resp, parseMdTable(s));
  }

  return {
    description: splitDesc[0].trim(),
    headersMeta: parseMdTable(splitDesc2[0]),
    queryMeta: parseMdTable(splitDesc3[0]),
    pathMeta: parseMdTable(splitDesc4[0]),
    bodyMeta: parseMdTable(splitDesc5[0]),
    responseMeta: resp
  }
}

function parseResponse(responses, events, responseHeaders, responseMeta) {
  if (responses != null && Array.isArray(responses) && responses.length > 0) {
    return parseResponseFromExamples(responses, responseHeaders, responseMeta)
  } else {
    return { responses: parseResponseFromEvents(events, responses) }
  }
}

function parseResponseFromEvents(events = [], responses) {
  let status = 200
  const test = events.filter(event => event.listen === 'test')
  if (test.length > 0) {
    const script = test[0].script.exec.join()
    const result = script.match(/\.response\.code\)\.to\.eql\((\d{3})\)|\.to\.have\.status\((\d{3})\)/)
    status = (result && result[1] != null) ? result[1] : (result && result[2] != null ? result[2] : status)
  }
  return {
    [status]: {
      description: 'Successful response',
      content: {
        'application/json': {}
      }
    }
  }
}

function parseResponseFromExamples(responses, responseHeaders, responseMeta) {
  // Group responses by status code
  const statusCodeMap = responses
    .reduce((statusMap, { name, code, status: description, header, body, _postman_previewlanguage: language }) => {

      if (code in statusMap) {
        if (!(language in statusMap[code].bodies)) {
          statusMap[code].bodies[language] = []
        }
        statusMap[code].bodies[language].push({ name, body })
      } else {
        statusMap[code] = {
          description,
          header,
          bodies: { [language]: [{ name, body }] }
        }
      }

      return statusMap
    }, {})
  // Parse for OpenAPI
  const parsedResponses = Object.entries(statusCodeMap)
    .reduce((parsed, [status, { description, header, bodies }]) => {
      if (bodies.json[0].body == "") {
        parsed[status] = {
          description,
          ...parseResponseHeaders(header, responseHeaders, responseMeta),
          ...parseContent('', '')
        }
      } else {
        parsed[status] = {
          description,
          ...parseResponseHeaders(header, responseHeaders, responseMeta),
          ...parseContent(bodies, responseMeta[status])
        }
      }

      return parsed
    }, {})

  return { responses: parsedResponses }
}

function parseContent(bodiesByLanguage, responseMeta) {

  const content = Object.entries(bodiesByLanguage)
    .reduce((content, [language, bodies]) => {

      if (language === 'json') {
        content['application/json'] = parseRespData(bodies, 'json', responseMeta)
      } else {
        content['text/plain'] = {
          schema: { type: 'string' },
          ...parseExamples(bodies, 'text')
        }
      }
      return content
    }, {})
  return { content }
}

function parseExamples(bodies, language) {
  if (Array.isArray(bodies) && bodies.length > 1) {
    return {
      examples: bodies.reduce((ex, { name: summary, body }, i) => {
        ex[`example-${i}`] = {
          summary,
          value: safeSampleParse(body, summary, language)
        }
        return ex
      }, {})
    }
  } else {
    const { body, name } = bodies[0]
    return {
      example: safeSampleParse(body, name, language)
    }
  }
}

function safeSampleParse(body, name, language) {
  if (language === 'json') {
    const errors = []
    const parsedBody = jsonc.parse((body == null || body.trim().length === 0) ? '{}' : body, errors)
    if (errors.length > 0) {
      throw new Error('Error parsing response example "' + name + '"')
    }
    return parsedBody
  }
  return body
}

function parseResponseHeaders(headerArray, responseHeaders) {
  if (!responseHeaders) {
    return {}
  }
  headerArray = headerArray || []
  const headers = headerArray.reduce((acc, { key, value }) => {
    acc[key] = {
      schema: {
        type: inferType(value),
        example: key
      }
    }
    return acc
  }, {})
  return (Object.keys(headers).length > 0) ? { headers } : {}
}

/**
 * Just check if is a string collection or a path.
 * moved to method for allow easy changes in the future like check if it is a collection, validations...
*/
async function resolveInput(input) {
  if (input.trim().startsWith('{')) {
    return input
  } else {
    return readFile(input, 'utf8')
  }
}

/**
 * return if the provided text contains the '[required]' mark
 * @param {*} text The text where we should look for the required mark
 * @returns boolean
 */
function isRequired(text) {
  return /\[required\]/gi.test(text)
}

/**
 * calculate the operationId based on the user selected `mode`
 * @param {*} mode - mode to calculate the operation id between `off`, `auto` or `brackets`
 * @param {*} name - field name of the request/operation in the postman collection without modify.
 * @param {*} summary - calculated summary of the operation that will be used in the OpenAPI spec.
 * @returns an operation id
 */
function calculateOperationId(mode, name, summary) {
  let operationId
  switch (mode) {
    case 'off':
      break
    case 'auto':
      operationId = camelCase(summary)
      break
    case 'brackets': {
      // eslint-disable-next-line no-useless-escape
      const matches = name.match(/\[([^\[\]]*)\]/)
      operationId = matches ? matches[1] : undefined
      break
    }
    default: // Unknown value in the operationId option
      break
  }
  return operationId ? { operationId } : {}
}

postmanToOpenApi.version = version

module.exports = postmanToOpenApi