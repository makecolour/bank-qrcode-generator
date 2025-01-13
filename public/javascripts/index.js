var app = angular.module('qrApp', [])
        .controller('MainController', ['$scope', '$http', '$sce', function($scope, $http, $sce) {
          $scope.qrData = {
            service_code: 'account',
          };
          $scope.qrResult = null;
          $scope.qrType = '';
          $scope.error = '';
          $scope.banks = [];
          $scope.services = [
            { code: 'account', name: 'Bank to account' },
            { code: 'card', name: 'Bank to card' }
          ];
          $scope.errorCorrectionLevels = [
            { code: 'L', name: 'Low' },
            { code: 'M', name: 'Medium' },
            { code: 'Q', name: 'Quartile' },
            { code: 'H', name: 'High' }
          ];
          // Fetch bank data
          $http.get('/api/v2/banks')
            .then(function(response) {
              $scope.banks = response.data;
            })
            .catch(function(error) {
              console.error('Error fetching banks:', error);
            });

          $scope.generateQR = function(type) {
            $scope.error = '';
            const url = type === 'png' ? '/api/qr-png' : '/api/qr-svg';
            $http.get(url, { params: $scope.qrData })
              .then(function(response) {
                $scope.qrType = type;
                console.log(response);
                if(response.data.status === 'success') {
                  if (type === 'svg') {
                    $scope.qrResult = $sce.trustAsHtml(response.data.data);
                  } else {
                    $scope.qrResult = response.data.data;
                  }
                }
              })
              .catch(function(error) {
                console.error('Error generating QR code:', error);
                $scope.error = 'Error generating QR code: ' + error.data;
              });
          };
        
        }]);
