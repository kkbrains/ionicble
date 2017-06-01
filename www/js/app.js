// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'ngCordova', 'ngStorage'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

.controller('mainCntrl', function($scope, $timeout, $http, $q){
  $scope.scanprogress = "Bluetooh started";
  $scope.showButton = false;
  $scope.spin = {};
  $scope.btnname = "Connect Spin"
  $scope.bluetoothInitialized = false;
  $scope.spin.services = [];
  $scope.readValue = [];
  $scope.hD='0123456789ABCDEF';

  $scope.chemicalResults = [];

  $scope.init = function(){

    bluetoothle.initialize(function(success){}, {
      "request": true,
      "statusReceiver": false,
      "restoreKey" : "bluetoothleplugin"
      });
   $scope.initBluetooth();
  }


  $scope.initBluetooth = function(){
      $scope.bluetoothInitialized = true;
       
  }
  $scope.startScan = function(){
    bluetoothle.startScan(function(success) {
       
      $scope.scanprogress = "scanning  in progress ";
      $scope.console(success.name);
      if(success.name !== undefined && success.name !== null){

        if(success.name.indexOf("SpinTouch")  === 0){
          $scope.scanprogress = "Spin detected";
          $scope.spin = success;
          localStorage.setItem('spin', success);
          $scope.showButton = true;
          $scope.stopScan();
        }
      }
        $scope.$apply();
      },function(err){
        
        if(err.message == "Scanning already in progress"){
            $scope.scanprogress = "scanning  in progress ";
            $scope.$apply();
        }
        else
           $scope.console(err);
      });
  }

  $scope.stopScan = function(){
    bluetoothle.stopScan(function(stop) { 
      $scope.scanprogress = "scanning stopped";
      $scope.$apply();
    }, function(err){
      $scope.console(err);
    });
  }


$scope.discoverSpin = function(){
     bluetoothle.discover(function(read) { 
      $scope.spin.discovery = read;
      $scope.spin.services  = read.services[0].characteristics;
      $scope.spin.service = read.services[0].uuid;
      $scope.spin.characteristic = read.services[0].characteristics[1].uuid;
      $scope.$apply();
      $scope.subscribe();
    }, function(err) {
      $scope.console(err);
    }, {address: $scope.spin.address});
}

$scope.subscribe = function(){
  bluetoothle.subscribe(function(obj) {
    if(obj.value !== undefined){
      $scope.$apply();
      bluetoothle.read(function(result){ $scope.capturedResult(result) },function(e) { $scope.console(err) },
        {"address":$scope.spin.address, "service":$scope.spin.service, "characteristic":"00000000-0000-1000-8000-BBBD00000010"});
   }
  }, function(err) {
    $scope.console(err);
  }, {
    "address" :$scope.spin.address,
    "service": $scope.spin.service,
    "characteristic": $scope.spin.characteristic
  });
}

$scope.dec2hex = function(d){
    var h = $scope.hD.substr(d&15,1);
    while (d>15) {
    d>>=4;
    h=$scope.hD.substr(d&15,1)+h;
    }
    h = h.toLowerCase();
    return h;
}


$scope.capturedResult = function(result){
  var output = bluetoothle.encodedStringToBytes(result.value);
  
  $scope.readings  = [];
  for (i=0; i<output.length; i++) {
         $scope.readings.push((output[i]<16?"0":"") + $scope.dec2hex(output[i]));
  }
  
 
   $scope.chemicalResults = [];
  //Get Chemicals
  $scope.constructSpinData(9, 5, 'FCL').then(function(obj){
    $scope.chemicalResults.push(obj);
  })
 
  $scope.constructSpinData(15, 11, 'TCL').then(function(obj){
    $scope.chemicalResults.push(obj);
  })
  $scope.constructSpinData(21, 17, 'CCL').then(function(obj){
    $scope.chemicalResults.push(obj);
  })
  $scope.constructSpinData(27, 23, 'pH').then(function(obj){
    $scope.chemicalResults.push(obj);
  })
  $scope.constructSpinData(33, 29, 'ALK').then(function(obj){
    $scope.chemicalResults.push(obj);
  })
  $scope.constructSpinData(39, 35, 'HARD').then(function(obj){
    $scope.chemicalResults.push(obj);
  })
  $scope.constructSpinData(45, 41, 'CYA').then(function(obj){
    $scope.chemicalResults.push(obj);
  })
   $scope.constructSpinData(51, 47, 'COPPER').then(function(obj){
    $scope.chemicalResults.push(obj);
  })
  $scope.constructSpinData(57, 53, 'IRON').then(function(obj){
    $scope.chemicalResults.push(obj);
  })
  $scope.constructSpinData(63, 59, 'BORATE').then(function(obj){
    $scope.chemicalResults.push(obj);
    
  })

}

$scope.constructSpinData = function(toInt, fromInt, name){
  var defer = $q.defer();
  var hexa = '';
  var obj = {};
  obj.name = name;
  
  for(var i=toInt;i>fromInt;i--){
    hexa += $scope.readings[i];
  }
   //Convert Hexa to Decimal 
  $http.get('http://reseller.pooltrackr.com/api/hextodecimal/' + hexa).then(function(data){
    var fixedNo = parseInt($scope.readings[fromInt], 16);
    obj.result = parseFloat(data.data.msg).toFixed(fixedNo);
    defer.resolve(obj);
  }, function(err){
    defer.reject(err);
  })
  return defer.promise;
}



$scope.console = function(value){
  console.log(value);
}
$scope.connectSpin = function(){
  if($scope.btnname == 'Disconnect Spin'){
    bluetoothle.disconnect(function(success){
      $scope.scanprogress = "Spin Disconnected";
       $scope.btnname = "Connect Spin";
      $scope.console(success);
       $scope.$apply();
    }, function(err){
      $scope.console(err)
    }, {
      address: $scope.spin.address
    });
  }else{
     bluetoothle.connect(function(success){
       $scope.scanprogress = "Spin Connected";
       $scope.btnname = "Disconnect Spin";
       $scope.discoverSpin();
       $scope.$apply();
    }, function(err) {
      if(err.name.indexOf('Spin') == 0){

       bluetoothle.reconnect(function(success){
        $scope.btnname = "Disconnect Spin"
        $scope.discoverSpin();
         $scope.$apply();
       }, function(err) {
        bluetoothle.close(function(success){$scope.console(success)}, function(err){$scope.console(err)}, {address: $scope.spin.address});
       }, {address: $scope.spin.address});
      }

    }, {address: $scope.spin.address});
  }
}


$timeout(function(){
  $scope.init();
},3000)
  
})
