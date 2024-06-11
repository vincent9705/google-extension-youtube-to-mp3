document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('openPage').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            let activeTab = tabs[0];
            let activeTabUrl = activeTab.url;
            loadingState();
            chrome.runtime.sendMessage(
                { action: 'openAndFill', url: activeTabUrl},
            );
        });
    });

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        let activeTab = tabs[0];
        let activeTabUrl = activeTab.url;
        let previousUrl = await getPreviousUrl();

        console.log(previousUrl);
        console.log(activeTabUrl);

        if (await getLoadingState() && activeTabUrl == previousUrl) {
            loadingState();
        }
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'displayErrorMsg') {
        errorState(request.msg);
    } else if (request.action === 'displayCompleted') {
        completeState();
    }
});

function loadingState() {
    setLoadingState(true);
    document.getElementById('errorMsg').textContent = '';
    document.getElementById('openPage').classList.add('d-none');
    document.getElementById('loading').classList.remove('d-none');
}

function errorState(msg) {
    document.getElementById('errorMsg').textContent = msg;
    document.getElementById('openPage').textContent = "Try Again!"
    document.getElementById('openPage').classList.remove('d-none');
    document.getElementById('loading').classList.add('d-none');
}

function completeState() {
    document.getElementById('openPage').classList.remove('d-none');
    document.getElementById('loading').classList.add('d-none');
}

function getLoadingState() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'getLoadingState' }, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response.isLoading);
            }
        });
    });
}

function setLoadingState(state) {
    chrome.runtime.sendMessage({ action: 'setLoadingState', theState: state });
}

function getPreviousUrl() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'getPreviousUrl' }, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response.previousUrl);
            }
        });
    });
}