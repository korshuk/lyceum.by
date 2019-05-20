'use strict';
const EXAM_REPORT_TYPE = 1,
      STATS_REPORT_TYPE = 2,
      ALL_STATS_REPORT_TYPE = 3;

const EXAM_NUMBER_NAMES = {
        1: 'first', 
        2: 'second'
    };

var templateControllers = angular.module('templateControllers', []);

templateControllers.factory('dataService', dataService);

templateControllers.controller('listController', listController);

templateControllers.controller('template1Controller', template1Controller);

templateControllers.controller('template2Controller', template2Controller);

templateControllers.controller('template3Controller', template3Controller);

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
            var url = `/admin/report/show/${vm.data.type}?`;
            var props = {};
            var currentProfile;
            var examNumber = 2;
            for (var i = 0; i < vm.profiles.length; i++) {
                if (vm.profiles[i].name == vm.data.profile) {
                    currentProfile = vm.profiles[i];
                }
            }
            if (currentProfile.firstExamName == vm.data.subject) {
                examNumber = 1;
            } 
            props.examNumber = examNumber;
            props.subject = vm.data.subject;
            props.profile = currentProfile.name;
            props.profileId = currentProfile._id;
            props.date = currentProfile[`${EXAM_NUMBER_NAMES[examNumber]}ExamDate`];
            props.startTimeString =  $filter('date')(vm.data.startTime, "HH часов mm минут");
            props.endTimeString =  $filter('date')(vm.data.endTime, "HH часов mm минут");
            props.testVariant = vm.data.testVariant;
            props.entryDate = vm.data.entryDate;
            console.log(props, queryStringFromObj(props), url + queryStringFromObj(props));

            openInNewTab(url + queryStringFromObj(props))

            
            
            /*dataService.postData(vm.data).then(function (res) {
                if (res.data.id) {
                    window.location = '/admin/report/generated/' + res.data.id;
                }
            })*/
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


function template2Controller(dataService, $filter) {
    var vm = this;
    vm.barOptions = [0,1,2,3,4,5,6,7,8,9];
    vm.dateOptions = {
        dateDisabled: false,
        formatYear: 'yy',
        maxDate: new Date(2020, 5, 22),
        minDate: new Date(),
        startingDay: 1
    };
    vm.datePopup = {};
    vm.statsForm = {};
    vm.data = {
        type: STATS_REPORT_TYPE,
        barNum: '4',
        barToEndNum: '5'
    };
    
    vm.map;

    vm.onProfileChange = onProfileChange;
    vm.onFormSubmit = onFormSubmit;
    vm.openDatePopup = openDatePopup;

    dataService.getProfiles().then(getProfilesToSubjectMap)

    function openDatePopup() {
        vm.datePopup.opened = true;
    };

    function onProfileChange(selectedProfile) {
        vm.subjects = vm.map[selectedProfile];
    }

    function onFormSubmit() {
        vm.statsForm.$submitted = true;
        if (vm.statsForm.$valid) {
            var url = `/admin/report/show/${vm.data.type}?`;
            var props = {};
            var currentProfile;
            var examNumber = 2;
            for (var i = 0; i < vm.profiles.length; i++) {
                if (vm.profiles[i].name == vm.data.profile) {
                    currentProfile = vm.profiles[i];
                }
            }
            if (currentProfile.firstExamName == vm.data.subject) {
                examNumber = 1;
            } 
            props.barNum = vm.data.barNum;
            props.barToEndNum = vm.data.barToEndNum;
            props.examNumber = examNumber;
            props.subject = vm.data.subject;
            props.profile = currentProfile.name;
            props.profileId = currentProfile._id;
            props.date = currentProfile[`${EXAM_NUMBER_NAMES[examNumber]}ExamDate`];
            props.entryDate = vm.data.entryDate;

            openInNewTab(url + queryStringFromObj(props))
            
            
            /*dataService.postData(vm.data).then(function (res) {
                if (res.data.id) {
                    window.location = '/admin/report/generated/' + res.data.id;
                }
            })*/
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

function template3Controller(dataService, $filter) {
    var vm = this;
    vm.barOptions = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19];
    vm.dateOptions = {
        dateDisabled: false,
        formatYear: 'yy',
        maxDate: new Date(2020, 5, 22),
        minDate: new Date(),
        startingDay: 1
    };
    vm.datePopup = {};
    vm.statsForm = {};
    vm.data = {
        type: ALL_STATS_REPORT_TYPE,
        barNum: '9',
        barToEndNum: '10'
    };
    
    vm.map;
    vm.onProfileChange = onProfileChange;
    vm.onFormSubmit = onFormSubmit;
    vm.openDatePopup = openDatePopup;

    dataService.getProfiles().then(getProfilesToSubjectMap)

    function openDatePopup() {
        vm.datePopup.opened = true;
    };

    function onProfileChange(selectedProfile) {
        vm.subjects = vm.map[selectedProfile];
        for (var i = 0; i < vm.profiles.length; i++) {
            if (vm.profiles[i].name === selectedProfile) {
                vm.selectedProfile = vm.profiles[i];
            }
        }
    }

    function onFormSubmit() {
        vm.statsForm.$submitted = true;
        if (vm.statsForm.$valid) {
            var url = `/admin/report/show/${vm.data.type}?`;
            var props = {};
            var currentProfile;
            for (var i = 0; i < vm.profiles.length; i++) {
                if (vm.profiles[i].name == vm.data.profile) {
                    currentProfile = vm.profiles[i];
                }
            }
            props.barNum = vm.data.barNum;
            props.barToEndNum = vm.data.barToEndNum;
            props.profile = currentProfile.name;
            props.profileId = currentProfile._id;
            props.entryDate = vm.data.entryDate;

            openInNewTab(url + queryStringFromObj(props))
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

function openInNewTab(url) {
    var win = window.open(url, '_blank');
    win.focus();
  }

function queryStringFromObj(params) {
    return Object.keys(params).map(function(key) {
        return key + '=' + params[key]
    }).join('&');
}  