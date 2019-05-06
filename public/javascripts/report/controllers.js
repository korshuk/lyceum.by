'use strict';
const EXAM_REPORT_TYPE = 1,
      ENROLLMENT_REPORT_TYPE = 2;

const EXAM_NUMBER_NAMES = {
        1: 'first', 
        2: 'second'
    };

var templateControllers = angular.module('templateControllers', []);

templateControllers.factory('dataService', dataService);

templateControllers.controller('listController', listController);

templateControllers.controller('template1Controller', template1Controller);

templateControllers.controller('template2Controller', template2Controller);

templateControllers.$ingect = ['dataService', '$filter'];
dataService.$ingect = ['$http'];

function template1Controller(dataService, $filter) {
    var vm = this;

    vm.dateOptions = {
        dateDisabled: false,
        formatYear: 'yy',
        maxDate: new Date(2020, 5, 22),
        minDate: new Date(),
        startingDay: 1
    };
    vm.datePopup = {};
    vm.entranceTestForm = {};
    vm.data = {
        type: EXAM_REPORT_TYPE,
        testVariant: 'Вариант А и Вариант В',   
    };
    
    vm.map;

    vm.onProfileChange = onProfileChange;
    vm.onFormSubmit = onFormSubmit;
    vm.openDatePopup = openDatePopup;

    setDefaultTimes();
    dataService.getProfiles().then(getProfilesToSubjectMap)

    function setDefaultTimes() {
        var startD = new Date();
        var endD = new Date();
        startD.setHours( 9 );
        startD.setMinutes( 0 );
        endD.setHours( 12 );
        endD.setMinutes( 0 );

        vm.data.startTime = startD;
        vm.data.endTime = endD;
    }
    function openDatePopup() {
        vm.datePopup.opened = true;
    };

    function onProfileChange(selectedProfile) {
        vm.subjects = vm.map[selectedProfile];
    }

    function onFormSubmit() {
        vm.entranceTestForm.$submitted = true;
        if (vm.entranceTestForm.$valid) {
            var currentProfile;
            var examNumber;
            for (var i = 0; i < vm.profiles.length; i++) {
                if (vm.profiles[i].name == vm.data.profile) {
                    currentProfile = vm.profiles[i];
                }
            }
            if (currentProfile.firstExamName == vm.data.subject) {
                examNumber = 1;
            } else {
                examNumber = 2;
            }
            vm.data.examNumber = examNumber;
            vm.data.profileId = currentProfile._id;
            vm.data.date = currentProfile[`${EXAM_NUMBER_NAMES[examNumber]}ExamDate`];
            vm.data.startTimeString =  $filter('date')(vm.data.startTime, "HH часов mm минут");
            vm.data.endTimeString =  $filter('date')(vm.data.endTime, "HH часов mm минут");
            console.log(vm.data);

            dataService.postData(vm.data).then(function (res) {
                if (res.data.id) {
                    window.location = '/admin/report/generated/' + res.data.id;
                }
            })
        }
    }

    function getProfilesToSubjectMap(resp) {
        vm.map = {};
        vm.profiles = resp.data;
        for (var i = 0; i < vm.profiles.length; i++) {
            vm.map[vm.profiles[i].name] = [vm.profiles[i].firstExamName, vm.profiles[i].secondExamName]
        };
    }
}


function template2Controller() {
    console.log('temp2');
}

function listController() {
    console.log('list');
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