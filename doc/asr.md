语音转文本API：

```
curl --request POST \
  --url https://open.bigmodel.cn/api/paas/v4/audio/transcriptions \
  --header 'Authorization: Bearer 9b36f0044c8a4d2eb486e3b037749361.3ow' \
  --header 'Content-Type: multipart/form-data' \
  --form model=glm-asr-2512 \
  --form stream=false \
  --form file='@example-file'
```

```
curl --request POST \
  --url https://open.bigmodel.cn/api/paas/v4/audio/transcriptions \
  --header 'Authorization: Bearer 9b36f0044c8a4d2eb486e3b037749361.3ow' \
  --header 'Content-Type: multipart/form-data' \
  --form model=glm-asr-2512 \
  --form stream=false \
  --form file='@example-file'
```

```
{
  "id": "<string>",
  "created": 123,
  "request_id": "<string>",
  "model": "<string>",
  "text": "<string>"
}
```

```
{"error":{"code":"1214","message":"file和audio参数不能同时为空"}}
```

使用 **[GLM-ASR-2512](https://docs.bigmodel.cn/cn/guide/models/sound-and-video/glm-asr-2512)** 模型将音频文件转录为文本，支持多语言和实时流式转录。

**Authorization**

**Authorization**

**string\<bearer>**

**required**

使用以下格式进行身份验证：Bearer

Bearer

**Body**

**file**

**file**

**required**

需要转录的音频文件，支持上传的音频文件格式：**`.wav / .mp3`**，规格限制：文件大小 ≤ **`25 MB`**、音频时长 ≤ **`30 秒`**

Drop a file here or click to upload

**model**

**enum\<string>**

**required**

要调用的模型编码

select modelglm-asr-2512

**file\_base64**

**string**

音频文件Base64编码。file\_base64 和 file 只需要传一个（同时传入以file为准）

**prompt**

**string**

在长文本场景中，可以提供之前的转录结果作为上下文。建议小于8000字。

**hotwords**

**string\[]**

热词表，用于提升特定领域词汇识别率。格式例如\["人名","地名"]，建议不超过100个。

Add an item

**stream**

**boolean**

该参数在使用同步调用时应设置为**`false`**或省略。表示模型在生成所有内容后一次性返回所有内容。默认值为**`false`**。如果设置为**`true`**，模型将通过标准**`Event Stream`**逐块返回生成的内容。当**`Event Stream`**结束时，将返回一个**`data: [DONE]`**消息。

select streamtruefalse

**request\_id**

**string**

请求唯一标识符。由用户端传递，**`ID`**长度要求：最少**`6`**个字符，最多**`64`**个字符，建议使用**`UUID`**格式确保唯一性，若未提供平台将自动生成。

**user\_id**

**string**

终端用户的唯一**`ID`**，帮助平台对终端用户的非法活动、生成非法不当信息或其他滥用行为进行干预。**`ID`**长度要求：至少**`6`**个字符，最多**`128`**个字符。

以上是API调用信息，将语音转文字的在线API，用户只需要配置Authorization的key即可。
