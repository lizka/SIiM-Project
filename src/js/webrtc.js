var WebRTC = {};

WebRTC.Core = (function(passedWindow, $) {

	// Internal variables and constants.
	var ErrorMessageSelector = "#error-message-container",
		VideoCanvasSelector = "#video-stream-canvas",
		CaptureButton = "#capture-button",
		StopButton = "#stop-button",

		onWebRtcFail,
		onSuccessfulHandleUserMediaWebkit,
		onSuccessfulHandleUserMediaOpera,

		captureUserMedia,
		detectUserMediaSupport,
		userMediaNotSupported,
		userMediaIsSupported,
		initialize;

	onSuccessfulHandleUserMediaWebkit = function(localMediaStream) {
		var video = $(VideoCanvasSelector)[0];

 	   	video.src = passedWindow.webkitURL.createObjectURL(localMediaStream);
	};

	onSuccessfulHandleUserMediaOpera = function(localMediaStream) {
		var video = $(VideoCanvasSelector)[0];

 	   	video.src = localMediaStream;
	};

	onWebRtcFail = function(eventObject) {
		console.error("[!!] Invoking methods from WebRTC standard failed", eventObject);
	};

	captureUserMedia = function() {
		$(StopButton).removeAttr("disabled");
		$(CaptureButton).attr("disabled", "disabled");

		if ($.browser.webkit) {
  			navigator.webkitGetUserMedia('video, audio', onSuccessfulHandleUserMediaWebkit, onWebRtcFail);
  		} else if ($.browser.opera) {
  			navigator.getUserMedia({ video: true, audio: true }, onSuccessfulHandleUserMediaOpera, onWebRtcFail);
  		}
	};

	stopCapturingMedia = function() {
		$(CaptureButton).removeAttr("disabled");
		$(StopButton).attr("disabled", "disabled");		

		$(VideoCanvasSelector)[0].pause();
	};

	userMediaIsSupported = function(argument) {
		$(CaptureButton).removeAttr("disabled");
		$(CaptureButton).click(captureUserMedia);
		$(StopButton).click(stopCapturingMedia);

		$(VideoCanvasSelector).show();
		$(ErrorMessageSelector).hide();
	};

	userMediaNotSupported = function() {
		$(VideoCanvasSelector).hide();
		$(ErrorMessageSelector).show();
		$(CaptureButton).attr("disabled", "disabled");
	};

	detectUserMediaSupport = function() {
		var isUserMediaStandardSupported = !!(navigator.getUserMedia || 
											  navigator.webkitGetUserMedia ||
            								  navigator.mozGetUserMedia || 
            								  navigator.msGetUserMedia);

		if (!isUserMediaStandardSupported) {
			userMediaNotSupported();
		} else {
			userMediaIsSupported();
		}
	};	 

	initialize = function() {
		detectUserMediaSupport();
	};

	// Handling OnDomContentLoaded event by jQuery.
	$(function() {
		initialize();
	});

} (window, jQuery));