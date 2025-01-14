app.factory('bankService', ['$http', function($http) {
    let banks = [];
    let isLoading = false;
    let isLoaded = false;

    const fetchBanks = function() {
        if (isLoaded) {
            return Promise.resolve(banks);
        }
        if (isLoading) {
            return new Promise((resolve, reject) => {
                const interval = setInterval(() => {
                    if (isLoaded) {
                        clearInterval(interval);
                        resolve(banks);
                    }
                }, 100);
            });
        }
        isLoading = true;
        return $http.get('/api/v2/banks')
            .then(function(response) {
                banks = response.data;
                isLoading = false;
                isLoaded = true;
                return banks;
            })
            .catch(function(error) {
                isLoading = false;
                console.error('Error fetching banks:', error);
                throw error;
            });
    };

    return {
        fetchBanks: fetchBanks
    };
}]);