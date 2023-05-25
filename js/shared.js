/**
 * An archetype entity is being deleted.  Delete it and some choice Annotations connected to it.
 * 
 * Might want to update the name of this to be delete from collection instead of delete this
 * 
 * 
 * @param event {Event} A button/link click event
 * @param collection {String} The name of the collection the entity belongs to, if any
 * @param type {String} The archtype object's type or @type.
 */ 
async function removeFromCollectionAndDelete(event, collection, type) {
    event.preventDefault()
    // Hold up not ready need to decide what artifacts need to be deleted.
    return

    // The URI for the item itself from the location hash, or null b/c it isn't available.
    const id = location.hash ? location.hash.substr(1) : null

    // Confirm they want to do this
    if (!id || !confirm(`Really delete this ${thing}?\n(Cannot be undone)`)) return

    const allAnnotationsTargetingEntityQueryObj = {
        target: httpsIdArray(id),
        "__rerum.generatedBy" : httpsIdArray("http://store.rerum.io/v1/id/61043ad4ffce846a83e700dd")
    }
    let allAnnotations = await fetch(DEER.URLS.QUERY, {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify(allAnnotationsTargetingEntityQueryObj)
    })
    .then(resp => resp.json())
    .catch(err => {
        alert("Could not gather Annotations for this Entity.")
        throw err
    })

    let redirect = ""
    let thing = ""
    switch(type){
        case "manuscript":
            // Such as ' [ Pn ] Paris, BnF, lat. 17233 ''
            // This manuscript has Ranges that represent Glosses of it.  Remove those Ranges too.
            //The target of each of these Annotations is the Gloss (range) that needs to be deleted.  This happens only when deleting a manuscript.
            const allGlossesOfManuscriptQueryObj = {
                "body.partOf.value": httpsIdArray(id),
                "__rerum.generatedBy" : httpsIdArray("http://store.rerum.io/v1/id/61043ad4ffce846a83e700dd")
            }
            let allGlossIds = await fetch(DEER.URLS.QUERY, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json; charset=utf-8"
                },
                body: JSON.stringify(allGlossesOfManuscriptQueryObj)
            })
            .then(resp => resp.json())
            .then(annos => annos.map(anno => anno.target))
            .catch(err => {
                alert("Could not gather Glosses to delete.")
                throw err
            })
            const allGlosses = allGlossIds.map(glossUri => {
                return fetch(DEER.URLS.DELETE, {
                    method: "DELETE",
                    body: JSON.stringify({"@id":glossUri}),
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                        "Authorization": `Bearer ${window.GOG_USER.authorization}`
                    }
                })
                .then(r => r.ok ? r.json() : Promise.reject(Error(r.text)))
                .catch(err => { 
                    console.warn("There was an issue removing an Annotation.")
                    console.log(err)
                })
            })
            // Wait for these to delete before moving on.  If the page finishes and redirects before this is done, that would be a bummer.
            // If one or more fails, keep going and try to delete the manuscript anyway.
            await Promise.all(allGlosses).then(success => {
                console.log("Connected Manuscript Glosses successfully removeD.")
            })
            .catch(err => {
                console.warn("There was an issue removing connected Glosses.")
                console.log(err)
            })
            redirect = "./manuscripts.html"
            thing = "Manuscript"
        break
        case "named-gloss":
            // Such as ' Loco et animo '
            redirect = "./named-glosses.html"
            thing = "Named Gloss"
        break
        case "Range":
            // A "Gloss", such as ' Pn Mt 5 Marginal '
            redirect = "./manage-glosses.html"
            thing = "Gloss"
        break
        default:
            console.warn(`Not sure what a ${thing} is...`)
    }
           
    fetch(DEER.URLS.QUERY, {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify(allAnnotationsTargetingEntityQueryObj)
    })
    .then(resp => resp.json())
    .then(annos => {
        const allAnnos = annos.map(anno => {
            return fetch(DEER.URLS.DELETE, {
                method: "DELETE",
                body: anno,
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "Authorization": `Bearer ${window.GOG_USER.authorization}`
                }
            })
            .then(r => r.ok ? r.json() : Promise.reject(Error(r.text)))
            .catch(err => { 
                console.warn("There was an issue removing an Annotation.")
                console.log(err)
            })
        })
        Promise.all(allAnnos).then(success => {
            alert("This item has been successfully deleted.  You will be redirected.")
            location.href = redirect
        })
        .catch(err => {
            console.warn("There was an issue removing Annotations.")
            console.log(err)
        })
    })
    .catch(err => {
        alert("There was an issue removing this item.  Refresh the page and try again.")
        throw err
    })
}

function getURLParameter(variable) {
    const query = window.location.search.substring(1)
    const vars = query.split("&")
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) { return pair[1] }
    }
    return (false)
}

function httpsIdArray(id, justArray) {
    if (!id.startsWith("http")) return justArray ? [id] : id
    if (id.startsWith("https://")) return justArray ? [id, id.replace('https', 'http')] : { $in: [id, id.replace('https', 'http')] }
    return justArray ? [id, id.replace('http', 'https')] : { $in: [id, id.replace('http', 'https')] }
}

function broadcast(event = {}, type, element, obj = {}) {
    let e = new CustomEvent(type, { detail: Object.assign(obj, { target: event.target }), bubbles: true })
    element.dispatchEvent(e)
}

/** Auth */
/*

const GLOSSING_USER_ROLES_CLAIM = "http://rerum.io/user_roles"
const GOG_ADMIN = "glossing_user_admin"
const GOG_CONTRIBUTOR = "glossing_user_contribustor"

const auth = document.querySelector('[is="auth-button"]')

auth.addEventListener("gog-authenticated", ev => {
    if (document.querySelector("[data-user='admin']")) {
        if( !tokenHasRole(ev.detail.authorization,GOG_ADMIN)){ document.querySelectorAll("[data-user='admin']").forEach(elem=>elem.replaceWith(`Restricted`)) }
    }

    if (document.querySelector("[data-user='contributor']")) {
        if( !tokenHasRole(ev.detail.authorization,GOG_CONTRIBUTOR)){ document.querySelectorAll("[data-user='contributor']").forEach(elem=>elem.replaceWith(`Restricted`)) }
    }
})
import jwt_decode from "./jwt.js"
function tokenHasRole(token,role) {
    const user = jwt_decode(token)
    return userHasRole(user, role)
}