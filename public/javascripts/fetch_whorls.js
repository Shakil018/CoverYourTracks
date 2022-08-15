$("#flashcontent").flash(
    {
      "src": "static/fonts2.swf",
      "width": "1",
      "height": "1",
      "swliveconnect": "true",
      "id": "flashfontshelper",
      "name": "flashfontshelper"
    },
    { update: false }
  );
  
  function identify_plugins(){
    // fetch and serialize plugins
    var plugins = "";
    // in Mozilla and in fact most non-IE browsers, this is easy
    if (navigator.plugins) {
      var np = navigator.plugins;
      var plist = new Array();
      // sorting navigator.plugins is a right royal pain
      // but it seems to be necessary because their order
      // is non-constant in some browsers
      for (var i = 0; i < np.length; i++) {
        plist[i] = np[i].name + "; ";
        plist[i] += np[i].description + "; ";
        plist[i] += np[i].filename + ";";
        for (var n = 0; n < np[i].length; n++) {
          plist[i] += " (" + np[i][n].description +"; "+ np[i][n].type +
                     "; "+ np[i][n].suffixes + ")";
        }
        plist[i] += ". ";
      }
      plist.sort();
      for (i = 0; i < np.length; i++)
        plugins+= "Plugin "+i+": " + plist[i];
    }
    // in IE, things are much harder; we use PluginDetect to get less
    // information (only the plugins listed below & their version numbers)
    if (plugins == "") {
      var pp = new Array();
      pp[0] = "Java"; pp[1] = "QuickTime"; pp[2] = "DevalVR"; pp[3] = "Shockwave";
      pp[4] = "Flash"; pp[5] = "WindowsMediaplayer"; pp[6] = "Silverlight";
      pp[7] = "VLC";
      var version;
      for ( p in pp ) {
        version = PluginDetect.getVersion(pp[p]);
        if (version)
          plugins += pp[p] + " " + version + "; "
      }
      plugins += ieAcrobatVersion();
    }
    return plugins;
  }
  
  function ieAcrobatVersion() {
    // estimate the version of Acrobat on IE using horrible horrible hacks
    if (window.ActiveXObject) {
      for (var x = 2; x < 10; x++) {
        try {
          oAcro=eval("new ActiveXObject('PDF.PdfCtrl."+x+"');");
          if (oAcro) 
            return "Adobe Acrobat version" + x + ".?";
        } catch(ex) {}
      }
      try {
        oAcro4=new ActiveXObject('PDF.PdfCtrl.1');
        if (oAcro4)
          return "Adobe Acrobat version 4.?";
      } catch(ex) {}
      try {
        oAcro7=new ActiveXObject('AcroPDF.PDF.1');
        if (oAcro7)
          return "Adobe Acrobat version 7.?";
      } catch (ex) {}
      return "";
    }
  }
  
  function get_fonts(js_fonts, cb) {
    // Try flash first
      var fonts = "";
      var obj = document.getElementById("flashfontshelper");
      if (obj && typeof(obj.GetVariable) != "undefined") {
          fonts = obj.GetVariable("/:user_fonts");
      fonts = fonts.replace(/,/g,", ");
      fonts += " (via Flash)";
      } else {
      // Try java fonts
      try {
        var javafontshelper = document.getElementById("javafontshelper");
        var jfonts = javafontshelper.getFontList();
        for (var n = 0; n < jfonts.length; n++) {
          fonts = fonts + jfonts[n] + ", ";
        }
      fonts += " (via Java)";
      } catch (ex) {}
    }
    if ("" == fonts){
      return js_fonts.join(", ") + " (via javascript)";
    } else {
      return fonts;
    }
  }
  
  function set_dom_storage(){
    try { 
      localStorage.panopticlick = "yea";
      sessionStorage.panopticlick = "yea";
    } catch (ex) { }
  }
  
  function test_dom_storage(){
    var supported = "";
    try {
      if (localStorage.panopticlick == "yea") {
         supported += "DOM localStorage: Yes";
      } else {
         supported += "DOM localStorage: No";
      }
    } catch (ex) { supported += "DOM localStorage: No"; }
  
    try {
      if (sessionStorage.panopticlick == "yea") {
         supported += ", DOM sessionStorage: Yes";
      } else {
         supported += ", DOM sessionStorage: No";
      }
    } catch (ex) { supported += ", DOM sessionStorage: No"; }
  
    return supported;
  }
  
  function test_ie_userdata(){
    try {
      oPersistDiv.setAttribute("remember", "remember this value");
      oPersistDiv.save("oXMLStore");
      oPersistDiv.setAttribute("remember", "overwritten!");
      oPersistDiv.load("oXMLStore");
      if ("remember this value" == (oPersistDiv.getAttribute("remember"))) {
        return ", IE userData: Yes";
      } else { 
        return ", IE userData: No";
      }
    } catch (ex) {
        return ", IE userData: No";
    }
  }
  
  function test_open_database(){
    return ", openDatabase: " + (!!window.openDatabase);
  }
  
  function test_indexed_db(){
    try {
      return ", indexed db: " + (!!window.indexedDB);
    } catch (e) {
      return ", indexed db: true";
    }
  }
  
  function get_touch_support(touch_support){
    var touch_support_str = ""
    touch_support_str += "Max touchpoints: " + String(touch_support[0]);
    touch_support_str += "; TouchEvent supported: " + String(touch_support[1]);
    touch_support_str += "; onTouchStart supported: " + String(touch_support[2]);
    return touch_support_str;
  }
  
  var success = 0;
  var retries = 20;
  
  function retry_post() {
    retries = retries -1;
    if (success || retries == 0)
      return 0;
    // no luck yet
    fetch_client_whorls()
  }
  
  function fetch_client_whorls(){
    var callback = function(randomized_results){
      return function(results){
        success = 1;
        json_results = JSON.parse(results);

        if(typeof trackerTest != 'undefined' && trackerTest){
          $('#fingerprintTable').html(json_results.markup);
          // the below is somewhat arbitrary.  we may want to have the result
          // determined by entropy rather than matches in the future
          // * note: if this logic changes, change in results-nojs route too.
          if(randomized_results >= 4){
            $('#fp_status').html(fp_status_str['almost_yes']);
          } else if(json_results.matching == 1){
            $('#fp_status').html(fp_status_str['no_unique']);
          } else if(json_results.matching <= 10){
            $('#fp_status').html(fp_status_str['no']);
          } else if(json_results.matching <= 50){
            $('#fp_status').html(fp_status_str['partial']);
          } else {
            $('#fp_status').html(fp_status_str['yes']);
          }
        } else {
          $('#content .content-background').html(json_results.markup);
        }
      }
    };
  
    const determine_randomized = function(run_1, run_2, catch_string, randomized_result) {
      try {
        const run_1_result = run_1();
        const run_2_result = run_2();
        if(run_1_result == run_2_result){
          return run_1_result;
        } else {
          return randomized_result || "randomized";
        }
      } catch(ex) {
        return catch_string || "undetermined";
      }
    }
  
    // fetch client-side vars
    var whorls_v2 = new Object();
  
    // this is a backup plan
    //setTimeout("retry_post()",1100);
  
    // Do not catch exceptions here because the async Flash applet will raise
    // them until it is ready.  Instead, if Flash is present, the retry timeout
    // will cause us to try again until it returns something meaningful.
  
    try {
      whorls_v2['video'] = screen.width+"x"+screen.height+"x"+screen.colorDepth;
    } catch(ex) {
      whorls_v2['video'] = "permission denied";
    }
  
    whorls_v2['language'] = navigator.language;
    whorls_v2['platform'] = navigator.platform;
    whorls_v2['cpu_class'] = navigator.cpuClass || "N/A";
    whorls_v2['hardware_concurrency'] = navigator.hardwareConcurrency || "N/A";
    whorls_v2['device_memory'] = navigator.deviceMemory || "N/A";
    whorls_v2['supercookies_v2'] = determine_randomized(
      () => test_dom_storage() + test_ie_userdata() + test_open_database() + test_indexed_db(),
      () => test_dom_storage() + test_ie_userdata() + test_open_database() + test_indexed_db(),
    );
    whorls_v2['timezone'] = determine_randomized(
      () => new Date().getTimezoneOffset(),
      () => new Date().getTimezoneOffset(),
      "permission_denied",
    );
    whorls_v2['plugins'] = determine_randomized(
      () => identify_plugins(),
      () => identify_plugins(),
      "permission denied",
    );
  
    let post_idle_callback = function(components, components_second_run){
      let components_hash = {};
      let components_second_run_hash = {};
  
      for(component of components){
        components_hash[component.key] = component.value;
      }
      for(component of components_second_run){
        components_second_run_hash[component.key] = component.value;
      }
  
      whorls_v2['canvas_hash_v2'] = determine_randomized(
        () => Fingerprint2_new.x64hash128(JSON.stringify(components_hash['canvas']), 31),
        () => Fingerprint2_new.x64hash128(JSON.stringify(components_second_run_hash['canvas']), 31),
      );
      whorls_v2['webgl_hash_v2'] = determine_randomized(
        () => Fingerprint2_new.x64hash128(JSON.stringify(components_hash['webgl']), 31),
        () => Fingerprint2_new.x64hash128(JSON.stringify(components_second_run_hash['webgl']), 31),
      );
      whorls_v2['fonts_v2'] = determine_randomized(
        () => get_fonts(components_hash['fonts']),
        () => get_fonts(components_second_run_hash['fonts']),
      );
      whorls_v2['audio'] = determine_randomized(
        () => components_hash['audio'],
        () => components_second_run_hash['audio'],
      );
      whorls_v2['touch_support'] = determine_randomized(
        () => get_touch_support(components_hash['touchSupport']),
        () => get_touch_support(components_second_run_hash['touchSupport']),
      );
      whorls_v2['timezone_string'] = determine_randomized(
        () => components_hash['timezone'],
        () => components_second_run_hash['timezone'],
      );
      whorls_v2['webgl_vendor_renderer'] = determine_randomized(
        () => components_hash['webglVendorAndRenderer'],
        () => components_second_run_hash['webglVendorAndRenderer'],
      );
  
      whorls_v2['ad_block'] = components_hash['adBlock'];
  
      // send to server for logging / calculating
      // and fetch results
  
      let randomized_results = 0;
      if (typeof(fpi_whorls) != "undefined") {
        if (fpi_whorls['v2']['audio'] != whorls_v2['audio'] && fpi_whorls['v2']['audio'] != "undetermined") {
          whorls_v2['audio'] = "randomized by first party domain";
          randomized_results++;
        }
        if (fpi_whorls['v2']['canvas_hash_v2'] != whorls_v2['canvas_hash_v2'] && fpi_whorls['v2']['canvas_hash_v2'] != "undetermined") {
          whorls_v2['canvas_hash_v2'] = "randomized by first party domain";
          randomized_results++;
        }
        if (fpi_whorls['v2']['webgl_hash_v2'] != whorls_v2['webgl_hash_v2'] && fpi_whorls['v2']['webgl_hash_v2'] != "undetermined") {
          whorls_v2['webgl_hash_v2'] = "randomized by first party domain";
          randomized_results++;
        }
        if (fpi_whorls['v2']['plugins'] != whorls_v2['plugins'] && fpi_whorls['v2']['plugins'] != "permission denied") {
          whorls_v2['plugins'] = "randomized by first party domain";
          randomized_results++;
        }
        if (fpi_whorls['v2']['hardware_concurrency'] != whorls_v2['hardware_concurrency']) {
          whorls_v2['hardware_concurrency'] = "randomized";
          randomized_results++;
        }
      }


      var wholeString = JSON.stringify({v2: whorls_v2, randomized_results});
      wholeString = wholeString.split(",");
      
      var splitString = "";
      for(i = 0; i < wholeString.length; i += 1){
        splitString += wholeString[i] + "\n\n\t";
      }

      // for (const [key, value] of Object.entries(object)) {
      //   myString += key + ": " + 
      // }

      fingerprintTable = document.getElementById("fingerprintTable");
      fingerprintTable.textContent = splitString;

      console.log("inside fetch_whorls.js");
      // console.log("data: ", JSON.stringify({v2: whorls_v2, randomized_results}))
      
     

    
      // $.post({
      //   url: "/ajax-fingerprint",
      //   data: JSON.stringify({v2: whorls_v2, randomized_results}),
      //   contentType: 'application/json',
      //   success: callback(randomized_results),
      //   dataType: "html"
      // });


    }



      function sortUsingNestedText(parent, childSelector, keySelector) {
        var items = parent.children(childSelector).sort(function(a, b) {
          var vA = $(keySelector, a).text();
          var vB = $(keySelector, b).text();
          return (vA < vB) ? -1 : (vA > vB) ? 1 : 0;
        });
        parent.append(items);
      }


      // setTimeout(
        function abc(){
        $('.results-table h4').each(function(i){
          function getText(file,self) {
            $.ajax({
              url : file,
              context: self,
              dataType: "text",
              success : function (data) {
                self.parent().find(".text").html(data);
              }
            })
          }
          if ($(this).html().includes('User Agent')) {
            var filename = '/static/results-text/user-agent.txt';
            var selfname = $(this).attr('data-group', '1header');
            getText(filename, selfname);
          }
          if ($(this).html().includes('HTTP_ACCEPT Headers')) {
            var filename = '/static/results-text/http-accept-headers.txt';
            var selfname = $(this).attr('data-group', '1header');
            getText(filename, selfname);
          }
          if ($(this).html().includes('Browser Plugin')) {
            var filename = '/static/results-text/browser-plugin-details.txt';
            var selfname = $(this).attr('data-group', '2browser');
            getText(filename, selfname);
          }
          if ($(this).html().includes('AudioContext')) {
            var filename = '/static/results-text/audiocontext.txt';
            var selfname = $(this).attr('data-group', '3fingerprint');
            getText(filename, selfname);
          }
          if ($(this).html().includes('Cookies Enabled')) {
            var filename = '/static/results-text/cookies-enabled.txt';
            var selfname = $(this).attr('data-group', '2browser');
            getText(filename, selfname);
          }
          if ($(this).html().includes('Device Memory')) {
            var filename = '/static/results-text/device-memory.txt';
            var selfname = $(this).attr('data-group', '4hardware');
            getText(filename, selfname);
          }
          if ($(this).html().includes('DNT Header')) {
            var filename = '/static/results-text/dnt-header.txt';
            var selfname = $(this).attr('data-group', '1header');
            getText(filename, selfname);
          }
          if ($(this).html().includes('Hardware Concurrency')) {
            var filename = '/static/results-text/hardware-concurrency.txt';
            var selfname = $(this).attr('data-group', '4hardware');
            getText(filename, selfname);
          }
          if ($(this).html().includes('Hash of canvas fingerprint')) {
            var filename = '/static/results-text/hash-of-canvas.txt';
            var selfname = $(this).attr('data-group', '3fingerprint');
            getText(filename, selfname);
          }
          if ($(this).html().includes('Hash of WebGL fingerprint')) {
            var filename = '/static/results-text/hash-of-webgl.txt';
            var selfname = $(this).attr('data-group', '3fingerprint');
            getText(filename, selfname);
          }
          if ($(this).html().includes('Limited supercookie ')) {
            var filename = '/static/results-text/limited-super-cookie.txt';
            var selfname = $(this).attr('data-group', '2browser');
            getText(filename, selfname);
          }
          if ($(this).html().includes('Platform')) {
            var filename = '/static/results-text/platform.txt';
            var selfname = $(this).attr('data-group', '4hardware');
            getText(filename, selfname);
          }
          if ($(this).html().includes('Screen Size')) {
            var filename = '/static/results-text/screen-size.txt';
            var selfname = $(this).attr('data-group', '2browser');
            getText(filename, selfname);
          }
          if ($(this).html().includes('System Fonts')) {
            var filename = '/static/results-text/system-fonts.txt';
            var selfname = $(this).attr('data-group', '3fingerprint');
            getText(filename, selfname);
          }
          if ($(this).html().includes('Time Zone')) {
            var filename = '/static/results-text/time-zone.txt';
            var selfname = $(this).attr('data-group', '2browser');
            getText(filename, selfname);
          }
          if ($(this).html().includes('Time Zone Offset')) {
            var filename = '/static/results-text/time-zone-offset.txt';
            var selfname = $(this).attr('data-group', '2browser');
            getText(filename, selfname);
          }
          if ($(this).html().includes('Touch Support')) {
            var filename = '/static/results-text/touch-support.txt';
            var selfname = $(this).attr('data-group', '4hardware');
            getText(filename, selfname);
          }
          if ($(this).html().includes('WebGL Vendor')) {
            var filename = '/static/results-text/webgl-vendor.txt';
            var selfname = $(this).attr('data-group', '3fingerprint');
            getText(filename, selfname);
          }
          if ($(this).html().includes('Language')) {
            var filename = '/static/results-text/language.txt';
            var selfname = $(this).attr('data-group', '2browser');
            getText(filename, selfname);
          }
          if ($(this).html().includes('Ad Blocker Used')) {
            var filename = '/static/results-text/ad-blocker.txt';
            var selfname = $(this).attr('data-group', '2browser');
            getText(filename, selfname);
          }
          if ($(this).html().includes('CPU Class')) {
            var filename = '/static/results-text/cpu-class.txt';
            var selfname = $(this).attr('data-group', '4hardware');
            getText(filename, selfname);
          }
        });
        $('#default-button').on( 'click', function(e) {
          $('#default-button').addClass('active');
          $('#detailed-button').removeClass('active');
          $('.detailed').hide();
        });
        $('#detailed-button').addClass('active');
        $('#detailed-button').on( 'click', function(e) {
          $('#detailed-button').addClass('active');
          $('#default-button').removeClass('active');
          $('.detailed').show();
        });
        // smaller phone, make table of contents (see results template)
        $('select').selectmenu({
          'change': function () {
            var val = $( "#characteristic option:selected" ).val();
            console.log('val='+val);
            window.location.href = val;
          }
        });
        // sort results by group
        sortUsingNestedText($('.detailed-results'), "div", "data-group");
        // add grouped results titles
        $( "<h3>Browser Characteristics</h3>" ).insertBefore('[id^=Browser]');
        $( "<h3>Fingerprint Metrics</h3>" ).insertBefore('[id^=System]');
        $( "<h3>Hardware Specs</h3>" ).insertBefore('[id^=Platform]');
        $( "<h3>Headers</h3>" ).insertBefore('[id^=User]');
      }
      // , 2000);






      abc();







  
    let fp2_get_components = function(){
      Fingerprint2_new.get(function(components){
        Fingerprint2_new.get(function(components_second_run){
          post_idle_callback(components, components_second_run);
        });
      });
    };
  
    if (window.requestIdleCallback) {
      requestIdleCallback(fp2_get_components);
    } else {
      setTimeout(fp2_get_components, 500);
    }
  
  };
  
  
  set_dom_storage();
  
  $(document).ready(function(){
    // wait some time for the flash font detection:
    // fetch_client_whorls();
    setTimeout("fetch_client_whorls()",100);
  });
  