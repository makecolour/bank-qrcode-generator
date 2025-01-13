app.controller('v2-controller', ['$scope', '$http', '$sce', function($scope, $http, $sce) {
    $scope.qrData = {
        service_code: 'account',
    };
    $scope.qrResult = null;
    $scope.qrType = '';
    $scope.error = '';
    $scope.banks = [];

    // Fetch bank data
    $http.get('/api/v2/banks')
        .then(function(response) {
            $scope.banks = response.data;
        })
        .catch(function(error) {
            console.error('Error fetching banks:', error);
        });

    $http.get('/api/v2/templates').then(function(response) {
        $scope.templates = response.data.data;
    }).catch(function(error) {
        console.error('Error fetching templates:', error);
    });

    $scope.generateQR = function(type) {
        $scope.error = '';
        let url = "";
        switch (type) {
            case 'png':
                url = '/api/v2/qr-png';
                break;
            case 'qr-string':
                url = '/api/v2/qr-string';
                break;
            case 'qr-quicklink':
                url = '/api/v2/qr-quicklink';
                break;
            default:
                break;
        }
        $http.get(url, { params: $scope.qrData })
            .then(function(response) {
                $scope.qrType = type;
                console.log(response);
                if(response.data.status === 'success') {
                    switch (type) {
                        case 'qr-string':
                            $scope.qrResult = response.data.data;
                            break;
                        case 'qr-quicklink':
                            $scope.qrResult = response.data.data;
                            break;
                        default:
                            $scope.qrResult = response.data.data;
                            break;
                    }
                }
            })
            .catch(function(error) {
                console.error('Error generating QR code:', error);
                $scope.error = 'Error generating QR code: ' + error.data;
            });
    };
}]);