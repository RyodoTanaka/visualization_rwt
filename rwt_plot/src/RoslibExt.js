// RoslibExt.js
/**
 * Retrieves a type of ROS topic.
 *
 * @param callback - function with params:
 *   * type - String of the topic type
 */
ROSLIB.Ros.prototype.getTopicType = function(topic, callback) {
  var topicTypeClient = new ROSLIB.Service({
    ros : this,
    name : '/rosapi/topic_type',
    serviceType : 'rosapi/TopicType'
  });
  var request = new ROSLIB.ServiceRequest({
    topic: topic
  });
  topicTypeClient.callService(request, function(result) {
    callback(result.type);
  });
};

/**
 * Retrieves a detail of ROS message.
 *
 * @param callback - function with params:
 *   * details - Array of the message detail
 * @param message - String of a topic type
 */
ROSLIB.Ros.prototype.getMessageDetails = function(message, callback) {
  var messageDetailClient = new ROSLIB.Service({
    ros : this,
    name : '/rosapi/message_details',
    serviceType : 'rosapi/MessageDetails'
  });
  var request = new ROSLIB.ServiceRequest({
    type: message
  });
  messageDetailClient.callService(request, function(result) {
    callback(result.typedefs);
  });
};

/**
 * Encode a typedefs into a dictionary like `rosmsg show foo/bar`
 * @param type_defs - array of type_def dictionary
 */
ROSLIB.Ros.prototype.decodeTypeDefs = function(type_defs) {
  var typeDefDict = {};
  var theType = type_defs[0];
  
  // It calls itself recursively to resolve type definition
  // using hint_defs.
  var decodeTypeDefsRec = function(theType, hint_defs) {
    var typeDefDict = {};
    for (var i = 0; i < theType.fieldnames.length; i++) {
      var arrayLen = theType.fieldarraylen[i];
      var fieldName = theType.fieldnames[i];
      var fieldType = theType.fieldtypes[i];
      if (fieldType.indexOf('/') === -1) { // check the fieldType includes '/' or not
        if (arrayLen === -1) {
          typeDefDict[fieldName] = fieldType;
        }
        else {
          typeDefDict[fieldName] = [fieldType];
        }
      }
      else {
        // lookup the name
        var sub_type = false;
        for (var j = 0; j < hint_defs.length; j++) {
          if (hint_defs[j].type.toString() === fieldType.toString()) {
            sub_type = hint_defs[j];
            break;
          }
        }
        if (sub_type) {
          var sub_type_result = decodeTypeDefsRec(sub_type, hint_defs);
          if (arrayLen === -1) {
            typeDefDict[fieldName] = sub_type_result;
          }
          else {
            typeDefDict[fieldName] = [sub_type_result];
          }
        }
        else {
          throw 'cannot find ' + fieldType;
        }
      }
    }
    return typeDefDict;
  };                            // end of decodeTypeDefsRec
  
  return decodeTypeDefsRec(type_defs[0], type_defs);
};

ROSLIB.Time = function(spec) {
  this.nsecs = (spec || {}).nsecs || 0;
  this.secs = (spec || {}).secs || 0;
};

ROSLIB.Time.now = function() {
  var now = new Date();
  var msec = now.getTime();
  return new ROSLIB.Time({
    secs: Math.ceil(msec / 1000),
    nsecs: (msec % 1000) * 1000000
  });
};

ROSLIB.Time.prototype.toSec = function() {
  return this.secs + this.nsecs / 1000000000.0;
};

ROSLIB.Time.prototype.substract = function(another) {
  var sec_diff = this.secs - another.secs;
  var nsec_diff = this.nsecs - another.nsecs;
  if (nsec_diff < 0) {
    sec_diff = sec_diff - 1;
    nsec_diff = 1000000000 + nsec_diff;
  }
  return new ROSLIB.Time({
    secs: sec_diff,
    nsecs: nsec_diff
  });
};

ROSLIB.Time.prototype.equal = function(another) {
  var diff = this.substract(another);
  return ((diff.secs === 0) && (diff.nsecs === 0));
};
