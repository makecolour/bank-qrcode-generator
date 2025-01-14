app.controller('v2-controller', ['$scope', '$http', '$sce', 'bankService', function($scope, $http, $sce, bankService) {
    $scope.qrData = {
        service_code: 'account',
    };
    $scope.qrResult = null;
    $scope.qrResultLink = '';
    $scope.qrResultString = '';
    $scope.qrType = '';
    $scope.error = '';
    $scope.banks = [];

    bankService.fetchBanks().then(function(banks) {
        $scope.banks = banks;
    }).catch(function(error) {
        console.error('Error fetching banks:', error);
    });

    $http.get('/api/v2/templates').then(function(response) {
        $scope.templates = response.data.data;
    }).catch(function(error) {
        console.error('Error fetching templates:', error);
    });

    $scope.generateQR = function(type) {
        $scope.error = '';
        $scope.qrResult = null;
        $scope.qrResultLink = '';
        $scope.qrResultString = '';
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
                if(response.data.status === 'success') {
                    switch (type) {
                        case 'qr-string':
                            $scope.qrResultString = response.data.data;
                            break;
                        case 'qr-quicklink':
                            $scope.qrResultLink = response.data.data;
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

    $scope.copyToClipboard = function(elementId) {
        var copyText = document.getElementById(elementId);
        copyText.select();
        copyText.setSelectionRange(0, 99999); /*For mobile devices*/
        document.execCommand("copy");
    }
}]);