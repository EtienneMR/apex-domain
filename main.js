const USERNAME = "EtienneMR"

const reposList = document.getElementById("repos-list")
const profilePicture = document.getElementById("profile-picture")

async function fetchPublicRepositories() {
    try {
        const response = await fetch(`https://api.github.com/users/${USERNAME}/repos?type=all&sort=updated`)

        if (!response.ok) {
            throw new Error(`GitHub API request failed: ${response.status} - ${response.statusText}`)
        }

        const repositories = await response.json()

        const unarchivedRepositories = repositories.filter(repo => !repo.archived)

        return unarchivedRepositories
    } catch (error) {
        console.error('Error fetching repositories:', error.message)
        throw error
    }
}

class ProjectCard {
    constructor(repo) {
        this.repo = repo

        const card = this.card = document.createElement("div")
        card.className = "card"

        const cardContent = this.content = document.createElement("div")
        cardContent.className = "card__content"
        card.appendChild(cardContent)

        const titleElement = document.createElement("p")
        titleElement.className = "card__title"
        cardContent.appendChild(titleElement)

        const titleAnchor = this.title = document.createElement("a")
        titleAnchor.target = "_blank"
        titleElement.append(titleAnchor)

        const subtitleElement = this.subtitle = document.createElement("p")
        subtitleElement.className = "card__subtitle"
        cardContent.appendChild(subtitleElement)

        const descriptionElement = this.description = document.createElement("p")
        descriptionElement.className = "card__description"
        cardContent.appendChild(descriptionElement)

        const linksElement = this.links = document.createElement("p")
        linksElement.className = "card__links"
        cardContent.appendChild(linksElement)

        reposList.appendChild(card)

        this.image = null

        this.setTitle(repo.name)
        this.setDescription(repo.description)
        this.addLink("Github", repo.html_url)

        this.fetch()
    }

    setTitle(title) {
        this.title.textContent = title
    }

    addLink(label, href) {
        this.title.href = href

        const linkElement = document.createElement("a")
        linkElement.textContent = label
        linkElement.href = href
        linkElement.target = "_blank"
        this.links.insertBefore(linkElement, this.links.firstChild)
    }

    setDescription(description) {
        this.description.textContent = description
    }

    setSubtitle(subtitle) {
        this.subtitle.textContent = subtitle
    }

    setImage(src) {
        if (this.image) this.image.remove()

        if (src) {
            const img = this.image = document.createElement("img")
            img.src = src
            img.classList.add("card_img")
            this.card.insertBefore(img, this.content)
        }
        else {
            const svg = this.image = document.createElementNS("http://www.w3.org/2000/svg", "svg")
            svg.setAttribute("viewBox", "0 0 24 24")
            svg.classList.add("card_img")
            this.card.insertBefore(svg, this.content)

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
            path.setAttribute("d", "M20 5H4V19L13.2923 9.70649C13.6828 9.31595 14.3159 9.31591 14.7065 9.70641L20 15.0104V5ZM2 3.9934C2 3.44476 2.45531 3 2.9918 3H21.0082C21.556 3 22 3.44495 22 3.9934V20.0066C22 20.5552 21.5447 21 21.0082 21H2.9918C2.44405 21 2 20.5551 2 20.0066V3.9934ZM8 11C6.89543 11 6 10.1046 6 9C6 7.89543 6.89543 7 8 7C9.10457 7 10 7.89543 10 9C10 10.1046 9.10457 11 8 11Z")
            svg.appendChild(path)
        }
    }

    async fetch() {
        const cahedData = sessionStorage.getItem(`project:${this.repo.full_name}`)


        if (cahedData) {
            const parsed = JSON.parse(cahedData)
            this.setSubtitle(parsed.subtitle)
            this.setImage(parsed.image)
            this.addLink("Afficher", `/${this.repo.name}`)
        }
        else {
            try {
                const files_response = await fetch(`https://api.github.com/repos/${this.repo.full_name}/contents`)

                if (!files_response.ok) {
                    throw new Error(`GitHub API request failed: ${files_response.status} - ${files_response.statusText}`)
                }

                const files = await files_response.json()

                const index_html = files.find(file => file.name == "index.html")

                if (index_html) {
                    const index_response = await fetch(index_html.download_url)

                    if (!index_response.ok) {
                        throw new Error(`GitHub API request failed: ${index_response.status} - ${index_response.statusText}`)
                    }

                    const indexContents = await index_response.text()

                    const parser = new DOMParser()
                    const doc = parser.parseFromString(indexContents, 'text/html')

                    const faviconLink = doc.querySelector('link[rel="icon"]') || doc.querySelector('link[rel="shortcut icon"]')
                    const title = doc.querySelector('title')

                    const href = faviconLink ? faviconLink.getAttribute("href") : null

                    const data = {
                        image: href ? (href.startsWith("https://") ? href : `/${this.repo.name}/${faviconLink.getAttribute("href")}`) : null,
                        subtitle: title ? title.textContent : "",
                    }

                    const stringified = JSON.stringify(data)
                    sessionStorage.setItem(`project:${this.repo.full_name}`, stringified)

                    this.setImage(data.image)
                    this.setSubtitle(data.subtitle)
                    this.addLink("Afficher", `/${this.repo.name}`)

                    return
                }
            } catch (error) {
                throw error
            }
            this.setImage(null)
            this.setSubtitle(this.repo.full_name)
        }
    }
}

(async () => {
    const repos = await fetchPublicRepositories()
    repos.forEach(async (repo) => {
        new ProjectCard(repo)
    })
})()
