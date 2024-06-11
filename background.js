let isLoading = false;
let previousUrl = null;

function executeDownload(url) {
    function observeElementRemoval(selector, callback) {
        const targetNode = document.body;
        const config = { childList: true, subtree: true }; // Observe changes in children and subtree
        let elementRemoved = false;

        const observerCallback = function (mutationsList, observer) {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    // Check if the target element is removed
                    if (!document.getElementById(selector) && !elementRemoved) {
                        elementRemoved = true;

                        observer.disconnect(); // Stop observing if the element is removed
                        if (typeof callback === 'function') {
                            callback(); // Call the provided callback function
                        }
                        break;
                    }
                }
            }
        };

        const observer = new MutationObserver(observerCallback);

        // Start observing the target node for configured mutations
        observer.observe(targetNode, config);
    }

    function getElementByText(tag, text) {
        const elements = document.getElementsByTagName(tag);
        for (let element of elements) {
            if (element.textContent.trim() === text) {
                return element;
            }
        }
        return null;
    }

    const inputField = document.querySelector('input[id="url"]');
    if (inputField) {
        inputField.value = url;
        const button = document.querySelector('input[type="submit"]');
        if (button) {
            console.log('Clicking button');
            button.click();
            observeElementRemoval('progress', () => {
                //todo: error handeling
                const downloadButton = getElementByText('a', 'Download')
                if (downloadButton) {
                    downloadButton.click();

                    setTimeout(() => {
                        //to close the tab
                        chrome.runtime.sendMessage({ action: 'downloadComplete' });
                    }, 2000);
                } else {
                    const form = document.querySelector('form');
                    const theDiv = form.querySelector('div');

                    setTimeout(() => {
                        //to close the tab
                        chrome.runtime.sendMessage({ action: 'convertFailed', error: theDiv.textContent });
                    }, 2000);
                }
            });
        }
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openAndFill') {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            // Get the current active tab
            const currentTab = tabs[0];
            chrome.tabs.create({ url: 'https://ytmp3s.nu/' }, (newTab) => {
                chrome.tabs.update(currentTab.id, { active: true });
                chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, tab) {
                    if (tabId === newTab.id && changeInfo.status === 'complete') {
                        previousUrl = request.url;
                        chrome.scripting.executeScript({
                            target: { tabId: newTab.id, allFrames: true },
                            func: executeDownload,
                            args: [request.url]
                        }).catch((error) => {
                            console.error('Error injecting content script:', error);
                        });

                        // Remove the listener to prevent it from firing multiple times
                        chrome.tabs.onUpdated.removeListener(listener);
                    }
                });
            });

            chrome.webRequest.onBeforeRequest.addListener(
                function(details) {
                // URL of the website to exclude
                const excludedWebsite = "https://ytmp3s.nu";
            
                // Check if the request is a main_frame (i.e., a new tab or window)
                if (details.type === "main_frame") {
                    // Logic to determine if the request is a popup
                    if (details.initiator && details.initiator !== details.url) {
                    // Exclude the specified website from being blocked
                    if (!details.url.startsWith(excludedWebsite)) {
                        console.log(`Blocking popup tab: ${details.url}`);
                        return { cancel: true };
                    }
                    }
                }
                },
                { urls: ["<all_urls>"] },
                ["blocking"]
            );
        });
    } else if (request.action === 'downloadComplete' && sender.tab.id) {

        // Close the tab after the download is complete
        isLoading = false;
        chrome.tabs.remove(sender.tab.id);
        chrome.runtime.sendMessage({ action: 'displayCompleted'});
    } else if (request.action === 'convertFailed' && sender.tab.id) {

        // Close the tab & display error message when it's failed
        isLoading = false;
        chrome.tabs.remove(sender.tab.id);
        chrome.runtime.sendMessage({ action: 'displayErrorMsg', msg: request.error });
    } else if (request.action === 'setLoadingState') {

        isLoading = request.theState;
    } else if (request.action === 'getLoadingState') {

        sendResponse({ isLoading });
    } else if (request.action === 'getPreviousUrl') {

        sendResponse({ previousUrl });
    }
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (tab.url && tab.url.includes("youtube.com")) {
        chrome.action.enable(tabId);
    } else {
        chrome.action.disable(tabId);
    }
});