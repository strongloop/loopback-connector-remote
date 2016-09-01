# loopback-connector-remote

Remote REST API connector for [loopback-datasource-juggler](https://github.com/strongloop/loopback-datasource-juggler).

- The version range 1.x is compatible with LoopBack 2.x.
- Use the upcoming versions 2.x for applications using LoopBack 3.x.

## Quick Explanation

Use this connector to create a datasource from another Loopback application.  Below is a quick example:

### datasource.json
```json
	"MyMicroService": {
		"name": "MyMicroService",
		"connector": "remote"
	}
```
Note that you should add a `url` property to point to another remote service.
If you do not specify a `url` property, the remote connector will point to it's own host name, port it's running on, etc.

The connector will generate models on the MyMicroService datasource object based on the models/methods exposed from the remote service.  Those models will have methods attached that are
from the model's remote methods.  So if you exposed a remote method from that micro-service called `bar` from the model `foo`,
the connector will automatically generate the following:

`app.datasources.MyMicroService.models.foo.bar()`

### Access it in any model file
To access the remote Loopback service in a model:

```javascript
module.exports = function(Message) {

	Message.test = function (cb) {
		Message.app.datasources.MyMicroService.models.SomeModel.remoteMethodNameHere(function () {});

		cb(null, {});
	};

};
```
