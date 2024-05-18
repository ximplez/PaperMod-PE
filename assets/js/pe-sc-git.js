function getGitRepoInfoWithCache(repo, cacheTimeInSeconds=3600) {
    if (!repo) {
        return ;
    }
    const cacheEntry = localStorage.getItem(repo.cacheKey);
    if (cacheEntry) {
        const { data, timestamp } = JSON.parse(cacheEntry);
        const diff = (new Date().getTime() - timestamp) / 1000;
        if (diff < cacheTimeInSeconds) {
            console.log(`Get github repo from cache: ${data}`)
            return data;
        }
    }

    return fetch(repo.url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(res => {
            const data = {
                platform: repo.platform,
                platformIcon: repo.platformIcon,
                stars: res[repo.dataField.stars],
                forks: res[repo.dataField.forks],
                watchers: res[repo.dataField.watchers],
                language: res[repo.dataField.language],
                description: res[repo.dataField.description],
                openIssues: res[repo.dataField.openIssues],
            }
            localStorage.setItem(repo.cacheKey, JSON.stringify({data, timestamp: new Date().getTime()}));
            return data;
        })
        .catch(error => console.error('Error fetching repository stats:', error));
}

function getLanguageColor(language) {
    const languageColor = {
        HTML: "#e34c26",
        CSS: "#563d7c",
        Java: "#b07219",
        JavaScript: "#f1e05a",
        TypeScript: "#3178c6",
        Go: "#00ADD8",
        Shell: "#89e051",
        C: "#555555",
        "C++": "#f34b7d",
        "C#": "#178600",
        Python: "#3572A5",
        Rust: "#3572A5",
        MATLAB: "#e16737",
        Lua: "#000080",
        Default: "#333333"
    }
    for (let color of Object.keys(languageColor)) {
        if (color === language) {
            return languageColor[color];
        }
    }
    return languageColor.Default;
}

window.addEventListener("DOMContentLoaded", function() {
    for (let repo of document.getElementsByClassName("pe-git")) {
        const gitRepository = detectRepository(repo);
        const repositoryInfo = getGitRepoInfoWithCache(gitRepository);
        if (repositoryInfo) {
            if (isPromise(repositoryInfo)) {
                repositoryInfo.then(data => {appendGitInfo(repo, data)});
            } else {
                appendGitInfo(repo, repositoryInfo);
            }
        }
    }
});

function detectRepository(element) {
    const repository = element.querySelector("a").innerText;
    if (element.classList.contains("github")) {
        return {
            name: repository,
            platform: "github",
            platformIcon: `<svg aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" class="pe-git-platform-icon"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path></svg>`,
            url: `https://api.github.com/repos/${repository}`,
            cacheKey: `PE_REPO_CACHE_GITHUB_${repository}`,
            dataField: {
                stars: "stargazers_count",
                forks: "forks_count",
                watchers: "subscribers_count",
                language: "language",
                description: "description",
                openIssues: "open_issues_count",
            }
        };
    }
    if (element.classList.contains("gitee")) {
        return {
            name: repository,
            platform: "gitee",
            platformIcon: `<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" class="pe-git-platform-icon"><path d="M512 1024C229.222 1024 0 794.778 0 512S229.222 0 512 0s512 229.222 512 512-229.222 512-512 512z m259.149-568.883h-290.74a25.293 25.293 0 0 0-25.292 25.293l-0.026 63.206c0 13.952 11.315 25.293 25.267 25.293h177.024c13.978 0 25.293 11.315 25.293 25.267v12.646a75.853 75.853 0 0 1-75.853 75.853h-240.23a25.293 25.293 0 0 1-25.267-25.293V417.203a75.853 75.853 0 0 1 75.827-75.853h353.946a25.293 25.293 0 0 0 25.267-25.292l0.077-63.207a25.293 25.293 0 0 0-25.268-25.293H417.152a189.62 189.62 0 0 0-189.62 189.645V771.15c0 13.977 11.316 25.293 25.294 25.293h372.94a170.65 170.65 0 0 0 170.65-170.65V480.384a25.293 25.293 0 0 0-25.293-25.267z" p-id="4553"></path></svg>`,
            url: `https://gitee.com/api/v5/repos/${repository}`,
            cacheKey: `PE_REPO_CACHE_GITEE_${repository}`,
            dataField: {
                stars: "stargazers_count",
                forks: "forks_count",
                watchers: "watchers_count",
                language: "language",
                description: "description",
                openIssues: "open_issues_count",
            }
        };
    }
}

function appendGitInfo(repo, data) {
    /* logo */
    repo.getElementsByClassName("pe-git-platform")[0].innerHTML = data.platformIcon;

    /* 描述 */
    repo.getElementsByClassName("pe-git-description")[0].innerText = data.description;

    /* 语言 */
    const languageColor = getLanguageColor(data.language);
    const gitLanguageElement = repo.getElementsByClassName("pe-git-language")[0];
    gitLanguageElement.innerHTML = `<span class="pe-dot" style="background: ${languageColor}"></span>` + data.language;

    /* 统计 */
    const gitCountsElement = repo.getElementsByClassName("pe-git-count")[0];
    gitCountsElement.innerHTML =
        `<span class="pe-git-count-item"><svg aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" class="pe-git-count-item-icon"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z"></path></svg>${data.stars}</span>
         <span class="pe-git-count-item"><svg aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" class="pe-git-count-item-icon"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path></svg></svg>${data.forks}</span>
         <span class="pe-git-count-item"><svg aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" class="pe-git-count-item-icon"><path d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.83.88 9.576.43 8.898a1.62 1.62 0 0 1 0-1.798c.45-.677 1.367-1.931 2.637-3.022C4.33 2.992 6.019 2 8 2ZM1.679 7.932a.12.12 0 0 0 0 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5c1.473 0 2.825-.742 3.955-1.715 1.124-.967 1.954-2.096 2.366-2.717a.12.12 0 0 0 0-.136c-.412-.621-1.242-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5c-1.473 0-2.825.742-3.955 1.715-1.124.967-1.954 2.096-2.366 2.717ZM8 10a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 10Z"></path></svg></svg>${data.watchers}</span>
         <span class="pe-git-count-item"><svg aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" class="pe-git-count-item-icon"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path></svg></svg>${data.openIssues}</span>`;
}

function isPromise(obj) {
    return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}