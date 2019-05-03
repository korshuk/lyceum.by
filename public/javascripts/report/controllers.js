'use strict';
const EXAM_REPORT_TYPE = 1,
    ENROLLMENT_REPORT_TYPE = 2;

var templateControllers = angular.module('templateControllers', []);

templateControllers.factory('dataService', dataService);

templateControllers.controller('template1Controller', template1Controller);

templateControllers.controller('template2Controller', template2Controller);

templateControllers.$ingect = ['dataService'];
dataService.$ingect = ['$http'];

function template1Controller(dataService) {
    var vm = this;
    vm.entranceTestForm = {};
    vm.data = {
        type: EXAM_REPORT_TYPE
    };
    vm.map;
    
    vm.onProfileChange = function (selectedProfile) {
        vm.subjects = vm.map[selectedProfile];
    }
    vm.onFormSubmit = function() {
        vm.entranceTestForm.$submitted=true;
        if (vm.entranceTestForm.$valid) {
            var currentProfile;
            for (var i = 0; i < vm.profiles.length; i++){
        if(vm.profiles[i].name == vm.data.profile){
            currentProfile = vm.profiles[i];
        }
            }
            if(currentProfile.firstExamName == vm.data.subject){
                vm.data.date = currentProfile.firstExamDate;
                vm.data.examNumber = 1;
            } else{
                vm.data.date = currentProfile.secondExamDate;
                vm.data.examNumber = 2;
            }
            console.log(vm.data);
            dataService.postData(vm.data).then(function(res) {
                if (res.data.id) {
                 window.location = '/admin/report/generated/' + res.data.id;
                }
            })
        }
    }

    dataService.getProfiles().then(function (resp) {
        vm.profiles = resp.data;           
     }).then(getProfilesToSubjectMap)
     

    function getProfilesToSubjectMap() {
        var map={};
        for (var i = 0; i < vm.profiles.length; i++) {
        map[vm.profiles[i].name] = vm.profiles[i].olympExams};
        vm.map = map;
    }   
}


function template2Controller() {
    console.log('temp2');
}

function dataService($http) {
    return {
        postData: postData,
        getProfiles: getProfiles
    }

    function postData(data) {
        return $http.post(`/admin/report/generate/${data.type}`, data);
    }
   
   function getProfiles() {
       return $http.get('/front/rest/sotka');
   }
}