angular.module('sotkaApp', [])
    .controller('sotkaController', function($scope, $timeout, sotkaFactory) {
        $scope.style = {
            left: 0
        };
        
        $scope.stopFlag = false;
        
        $scope.get = function () {
            sotkaFactory.getList()
                .success(function(response){
                    $scope.profiles = response;
                    var sum = 0;
                    var olymp = 0; 
                    var places = 0;
                    for (var i = 0; i < $scope.profiles.length; i++) {
                        if ($scope.profiles[i].ammount.length > 0) {
                            sum  = sum + $scope.profiles[i].ammount[$scope.profiles[i].ammount.length - 1].count
                        }                         
                        olymp = olymp + $scope.profiles[i].olymp || 0;
                        places = places + $scope.profiles[i].places;
                    }
                    
                    $scope.profiles.push({
                        common: true,
                        name: 'Общий конкурс',
                        ammount: [{
                            count: sum
                        }],
                        olymp: olymp,
                        places: places
                    })
                    
                    $scope.profiles[$scope.style.left].active = true;
                    $scope.moveNext();
                    $timeout(function(){
                        $scope.get();
                    }, 300000)          
                })
                .error(function(){
                     $timeout(function(){
                        $scope.get();
                    }, 300000);
                });
        }
        
        $scope.get();
        
        
        $scope.moveNext = function () {
            $timeout(function(){
                if (!$scope.stopFlag) {
                    $scope.profiles[$scope.style.left].active = false;
                    $scope.style.left = $scope.style.left + 1;
                    if ($scope.style.left >= $scope.profiles.length) {
                        $scope.style.left = 0;
                    }
                    $scope.profiles[$scope.style.left].active = true;
                } else {
                    $scope.stopFlag = false;
                }
                $scope.moveNext();
            }, 30000);
         } 
         
         $scope.moveToItem = function (num) {
             $scope.profiles[$scope.style.left].active = false;
             $scope.style.left = num;
             $scope.profiles[$scope.style.left].active = true;
             $scope.stopFlag = true;
         } 
        
    })
    .factory('sotkaFactory', function($http){
        return {
            getList: function () {
                return $http.get('/front/rest/sotka');
            }
        }
    });