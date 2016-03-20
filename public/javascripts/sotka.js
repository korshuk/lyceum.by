angular.module('sotkaApp', [])
    .controller('sotkaController', function($scope, sotkaFactory) {
        console.log('g');
        $scope.flag = true;
        $scope.profiles = [];
        
        sotkaFactory.getList()
            .success(function(response){
                $scope.profiles = response;
            })
        
        $scope.showProfilesOptions = function () {
            $scope.showProfilesFlag = !$scope.showProfilesFlag;
        }
        
        $scope.addProfile = function (p) {
            $scope.newProfile = {};
            sotkaFactory.addProfile(p)
                .success(function(response) {
                    $scope.profiles = response;
                })
  
        };
        
        $scope.removeProfile = function (p) {
            sotkaFactory.removeProfile(p)
                .success(function(response){
                    $scope.profiles = response;
                })
        };
        
         $scope.changeAmmount = function (p, num) {
             console.log(p);
             var count = 0;
             if (p.ammount.length > 0){
                 count = p.ammount[p.ammount.length - 1].count;
             }
             count = count + num;
             p.ammount.push({
                 count: count,
                 date: new Date()
             });
             $scope.saveProfile(p);
         };
         $scope.saveProfile = function (p) {
             sotkaFactory.updateProfile(p)
                .success(function(response){
                    $scope.profiles = response;
                })
         };
         $scope.changeOlymp = function (p, num) {
             p.olymp = p.olymp + num;
             $scope.changeAmmount(p, num);
         }
         $scope.updateOrder = function (p) {
             sotkaFactory.updateProfile(p)
                .success(function(response){
                    $scope.profiles = response;
                })
         }
    })
    .factory('sotkaFactory', function($http){
        return {
            getList: function () {
                return $http.get('/admin/rest/sotka');
            },
            addProfile: function (profile) {
                return $http.post('/admin/rest/sotka', profile);
            },
            removeProfile: function (profile) {
                return $http.post('/admin/rest/sotka/delete/' + profile._id, profile);
            },
            updateProfile: function (profile) {
                return $http.post('/admin/rest/sotka/' + profile._id, profile);
            }
        }
    });