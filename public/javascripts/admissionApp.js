(function () {
    'use strict';
    angular
        .module('admissionApp', ['ui.bootstrap', 'angular-loading-bar'])
        .filter('pupilsFilter', pupilsFilter)
        .filter('floor', floorFilter)
        .controller('admissionController', admissionController);

    admissionController.$ingect = ['$http', '$filter'];

    function admissionController($http, $filter) {
        var vm = this;

        vm.profiles = [];
        vm.currentPupilRecords = [];

        vm.started = false;
        vm.paused = false;
        vm.end = false;

        vm.start = start;
        vm.play = play;

        vm.assignHalfPassed = assignHalfPassed;
        vm.unassignHalfPassed = unassignHalfPassed;
        vm.row = 0;
        vm.col = 0;
        vm.maxAmmount = 100;

        getProfiles().then(getPupils).then(onData)
        
        function unassignHalfPassed(pupil, profile) {
            pupil.examResult = pupil.examResult - 0.001;
            profile.pupils = profile.pupils.sort(function(a,b){
                return b.examResult - a.examResult
            })
            calculateProfilesStats()
        }

        function assignHalfPassed(pupil, profile) {
            pupil.examResult = pupil.examResult + 0.001;
            profile.pupils = profile.pupils.sort(function(a,b){
                return b.examResult - a.examResult
            })
            calculateProfilesStats()
        }

        function start() {
            vm.row = 0;
            vm.col = 0;
            vm.started = true;

            algorithmStep();
        }

        function play() {
            var profile = vm.profiles[vm.col];
            profile.pupils[vm.row].isActive = false;
            var record;
            var newRow = vm.row;
            for(var i =0; i < vm.currentPupilRecords.length; i++) {
                record = vm.currentPupilRecords[i]
                vm.profiles[record.profileIndex].pupils[record.pupilIndex].isCurrent = false;
                if (vm.profiles[record.profileIndex].pupils[record.pupilIndex].leave === true) {
                    vm.profiles[record.profileIndex].pupils[record.pupilIndex].leave = false
                } else {
                    vm.profiles[record.profileIndex].pupils.splice(record.pupilIndex, 1);
                    vm.col = 0;
                    if (record.pupilIndex < newRow) {
                        newRow = record.profileIndex
                    }
                    
                }    
            }
            vm.row = newRow;
            calculateProfilesStats();

            vm.currentPupilRecords = []
            increaseCounters();
            algorithmStep();
        }

        function algorithmStep() {
            var profile = vm.profiles[vm.col];
            if (vm.row < vm.maxAmmount) {
                if (vm.row >= vm.profiles[vm.col].ammount) {
                    increaseCounters()
                    
                    algorithmStep()

                    return;
                }
                if (profile.pupils[vm.row].hasAdditional) {
                    vm.paused = true;
                    profile.pupils[vm.row].isActive = true;
                    vm.currentPupilRecords = findPupilRecords(profile.pupils[vm.row])

                    var record;
                    for(var i =0; i < vm.currentPupilRecords.length; i++) {
                        record = vm.currentPupilRecords[i]
                        vm.profiles[record.profileIndex].pupils[record.pupilIndex].isCurrent = true;
                        vm.profiles[record.profileIndex].pupils[record.pupilIndex].leave = vm.currentPupilRecords[i].leave
                    }

                } else {
                    increaseCounters()
                    
                    algorithmStep()
                }
            } else {
                vm.end = true
            }
        }

        function increaseCounters() {
            vm.col = vm.col + 1;
            if(vm.col === vm.profiles.length) {
                vm.row = vm.row + 1;
                vm.col = 0;
            }

        }

        function onData(data) {
            var pupils = data.pupils;
            var profiles = data.profiles;
            var pupil;
            
            for(var i = 0; i < pupils.length; i++) {
                pupil = pupils[i]
                if (pupil.diplomProfile && pupil.passOlymp) {
                    
                    if (pupil.isEnrolledToExams) {
                        var priority = 0

                        if (pupil.profile) {
                            pupil.hasAdditional = true
                            pupil.priority = priority;
                            pupil.examResult = calculateExamResult(pupil.resultsMap, profiles[pupil.profile], pupil );
                            profiles[pupil.profile].pupils.push(JSON.parse(JSON.stringify(pupil)));
                        }
                        if (pupil.additionalProfiles && pupil.additionalProfiles.length > 0) {
                        
                            for (var j = 0; j < pupil.additionalProfiles.length; j++) {
                                priority = priority + 1
                                pupil.priority = priority;
                                pupil.examResult = calculateExamResult(pupil.resultsMap, profiles[pupil.additionalProfiles[j]],pupil);
                                profiles[pupil.additionalProfiles[j]].pupils.push(JSON.parse(JSON.stringify(pupil)))
                            }
                        }
                        pupil.priority = priority + 1;
                        pupil.examResult = 500;
                        profiles[pupil.diplomProfile].pupils.push(JSON.parse(JSON.stringify(pupil)))
                    } else {
                        pupil.examResult = 500;
                        profiles[pupil.diplomProfile].pupils.push(JSON.parse(JSON.stringify(pupil)))
                    }
                } else {

                    if (pupil.additionalProfiles && pupil.additionalProfiles.length > 0) {
                        pupil.hasAdditional = true
                    }
                
                    if (pupil.profile) {
                        pupil.priority = 0;
                        pupil.examResult = calculateExamResult(pupil.resultsMap, profiles[pupil.profile], pupil );
                        profiles[pupil.profile].pupils.push(JSON.parse(JSON.stringify(pupil)));
                    }
                    if (pupil.additionalProfiles && pupil.additionalProfiles.length > 0) {
                        
                        for (var j = 0; j < pupil.additionalProfiles.length; j++) {
                            pupil.priority = j + 1;
                            pupil.examResult = calculateExamResult(pupil.resultsMap, profiles[pupil.additionalProfiles[j]],pupil);
                            profiles[pupil.additionalProfiles[j]].pupils.push(JSON.parse(JSON.stringify(pupil)))
                        }
                    }
                }
            }

            var profilesArray = [];
            for (var key in profiles) {
                var profile = profiles[key]
                profile.pupils = profile.pupils.sort(function(a,b){
                    return b.examResult - a.examResult
                })
                profilesArray.push(profile)

                var len=profile.pupils.length,
                    out=[],
                    counts={};

                for (var i=0;i<len;i++) {
                    var item = profile.pupils[i];
                    counts[item._id] = counts[item._id] >= 1 ? counts[item._id] + 1 : 1;
                    if (counts[item._id] === 2) {
                        out.push(item);
                    }
                }

                ///return out;
                console.log('key', out)
            }
            vm.profiles = profilesArray.sort(function(a,b) {
                return a.order - b.order
            })
            calculateProfilesStats()
            
        }

        function calculateProfilesStats () {
            vm.profiles.forEach(function(profile) {
                // console.log(profile.name, profile.ammount, profile.pupils[profile.ammount].examResult)
                //profile.resultPass = 
                var results = profile.pupils.map(function(pupil) {
                    return pupil.examResult;
                })

                profile.pass = results[profile.ammount-1];
                // console.log('profile.pass', results[profile.ammount], profile.pass)
                var indexOfPass = results.indexOf(profile.pass);
                var lastIndexOf = results.lastIndexOf(profile.pass);

                profile.halfDelta = 0;
                profile.halfPupils = 0;
                profile.halfpass = -1;
                profile.indexOfPass = indexOfPass;
                
                if (lastIndexOf - indexOfPass > 0) {
                    // console.log('indexes:', indexOfPass, lastIndexOf)
                    profile.halfpass = profile.pass;
                    profile.pass = results[indexOfPass - 1];
                    profile.indexOfPass = indexOfPass-1;
                    
                    var passed = results.length - lastIndexOf - 1;
                    // console.log('passed:', passed, results.length, lastIndexOf)
                    profile.halfDelta = profile.ammount - indexOfPass;
                    profile.halfPupils = lastIndexOf - indexOfPass + 1;
                    
                    if (profile.halfDelta == profile.halfPupils) {
                        profile.pass = profile.halfpass;
                        profile.indexOfPass = lastIndexOf;
                        profile.halfpass = -1;
                        profile.halfDelta = 0;
                        profile.halfPupils = 0;
                    }

                }
            })
        }

        function calculateExamResult(resultsMap, profile, pupil) {
            var examResult = 0;
            var result;
            var exam;
            
            for (var i = 1; i < 3; i++) {
                exam = profile['exam'+i];
                if (resultsMap && resultsMap[exam]) {
                    result = resultsMap[exam].result;

                    if (resultsMap[exam].examStatus && resultsMap[exam].examStatus === '0') {
                        if (result && result.Points) {
                            examResult = examResult + +result.Points
                        }
                        if (result && result.AdditionalPoints) {
                            examResult = examResult + +result.AdditionalPoints
                        }
                    }
                    if (resultsMap[exam].examStatus && resultsMap[exam].examStatus === '1') {
                        examResult = examResult - 450
                    }
                }
            }
            
            return examResult
        }

        function findPupilRecords(pupil) {
            const pupilRecords = [];
    
            vm.profiles.forEach(function(profile, index) {
                const pupilIndex = binaryPupilSearch(profile, pupil)
                if (pupilIndex > -1) {
                    pupilRecords.push({
                        profileId: profile._id,
                        profileIndex: index,
                        pupilIndex: pupilIndex
                    })
                }
            })

            pupilRecords.map(function(record) {
                record.priority = vm.profiles[record.profileIndex].pupils[record.pupilIndex].priority;
                record.examResult = vm.profiles[record.profileIndex].pupils[record.pupilIndex].examResult;
                record.profilePass = vm.profiles[record.profileIndex].pass;
                record.profileHalfPass = vm.profiles[record.profileIndex].halfpass
            })
            
            pupilRecords.sort(function(a, b) {
                return a.priority - b.priority
            })
            

            // 1. pass
            // 2. not pass d
            // 3. not pass d

            // 1. not pass d
            // 2. not pass d
            // 3. not pass d

            // 1. not pass d
            // 2. pass
            // 3. not pass d

            // 1. not pass d
            // 2. half pass
            // 3. not pass d

            // 1. not pass d
            // 2. half pass
            // 3. pass

            // 1. pass
            // 2. half pass d
            // 3. pass d
            var pupilIsPassed = false;
            for(var i =0; i < pupilRecords.length; i++) {
                // console.log('#####', i, pupilRecords[i].examResult, pupilRecords[i].profileHalfPass, pupilRecords[i].examResult < pupilRecords[i].profileHalfPass)
                if (!pupilIsPassed && pupilRecords[i].examResult >= pupilRecords[i].profilePass) {
                    pupilRecords[i].leave = true;
                    pupilIsPassed = true;
                }
                if (pupilRecords[i].profileHalfPass > -1) {
                    if (!pupilIsPassed && (pupilRecords[i].examResult === pupilRecords[i].profileHalfPass)) {
                        pupilRecords[i].leave = true;
                    }
                    if (pupilRecords[i].examResult < pupilRecords[i].profileHalfPass) {
                        pupilRecords[i].leave = true;
                    }
                } else {
                    if (pupilRecords[i].examResult < pupilRecords[i].profilePass) {
                        pupilRecords[i].leave = true;
                    }
                }
                

            }
            // console.log('pupilRecords', pupilRecords)
            return pupilRecords
            
        }

        function binaryPupilSearch(profile, pupil) {
            const pupils = profile.pupils;
            let pupilsResultForProfile = calculateExamResult(pupil.resultsMap, profile, pupil)
            if (pupil.diplomProfile && pupil.diplomProfile === profile._id && pupil.passOlymp) {
                pupilsResultForProfile = 500;
            }

            var foundIndex = _binarySearch(pupils, pupilsResultForProfile)

            if (foundIndex > -1) {
                var indexes = [];
                var index = foundIndex;
                var loopFlag = true;
                while (loopFlag) {
                    if (pupils[index] && pupils[index].examResult === pupilsResultForProfile) {
                        indexes.push(index)
                        index = index + 1;
                    } else {
                        loopFlag = false;
                    }
                }
                loopFlag = true;
                index = foundIndex - 1;
                while (loopFlag) {
                    if (pupils[index] && pupils[index].examResult === pupilsResultForProfile) {
                        indexes.push(index)
                        index = index - 1;
                    } else {
                        loopFlag = false;
                    }
                }
                var returnIndex = -1;
                for (let i = 0; i < indexes.length; i++) {
                    var currentIndex = indexes[i]
                    if (pupils[currentIndex]._id === pupil._id) {
                        returnIndex = currentIndex;
                        break;
                    }
                    
                }
                return returnIndex
            } else {
                return -1;
            }
        }

        function _binarySearch(pupils, pupilsResultForProfile) {
            let start = 0;
            let end = pupils.length - 1;
            while (start <= end) {
                
                let middle = Math.floor((start + end) / 2);
                
                if (pupils[middle].examResult === pupilsResultForProfile) {
                    // found the key
                    return middle;
                } else if (pupils[middle].examResult > pupilsResultForProfile) {
                    // continue searching to the right
                    start = middle + 1;
                } else {
                    // search searching to the left
                    end = middle - 1;
                }
            }
            
            // key wasn't found
            return -1;
        }

        function getPupils(profiles) {
            return $http
                .get('/admin/pupils/getApprovedForAdmission')
                .then(function(res) {
                    var pupils = res.data;
                    
                    return {
                        pupils: pupils,
                        profiles: profiles
                    }
                });
        }

        function getProfiles() {
            return $http
                .get('/admin/pupils/profiles/admission-list')
                .then(function(res) {
                    var profiles = {};

                    for (var i = 0; i < res.data.length; i++) {
                        profiles[res.data[i]._id] = res.data[i]
                        profiles[res.data[i]._id].pupils = []
                    }

                    return profiles
                });
        }
        
    }


    function pupilsFilter() {
        return function(pupils) {
            return pupils.filter(pupil => pupil.resultExamStatus === 0)
        }
    }

    function floorFilter(){
        return function(n){
            let value = n * 10
            value = Math.floor(value / 10)
            return value
            //return Math.floor(n);
        };
    }

})();