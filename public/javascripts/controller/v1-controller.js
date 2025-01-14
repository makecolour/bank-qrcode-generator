app.controller('v1-controller', ['$scope', '$http', '$sce', 'bankService', function($scope, $http, $sce, bankService) {
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
    $scope.isLoading = false;

    bankService.fetchBanks().then(function(banks) {
        $scope.banks = banks;
    }).catch(function(error) {
        console.error('Error fetching banks:', error);
    });

    $scope.generateQR = function(type) {
        $scope.error = '';
        const url = type === 'png' ? '/api/qr-png' : '/api/qr-svg';
        $scope.isLoading = true;
        $http.get(url, { params: $scope.qrData })
            .then(function(response) {
                $scope.qrType = type;
                if(response.data.status === 'success') {
                    if (type === 'svg') {
                        $scope.qrResult = $sce.trustAsHtml(response.data.data);
                    } else {
                        $scope.qrResult = response.data.data;
                    }
                }
                $scope.isLoading = false;
            })
            .catch(function(error) {
                console.error('Error generating QR code:', error);
                $scope.error = 'Error generating QR code: ' + error.data;
                $scope.isLoading = false;
            });
    };
}]);