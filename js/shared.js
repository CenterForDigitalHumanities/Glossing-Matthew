/**
 * An archetype entity is being deleted.  Delete it and some choice Annotations connected to it.
 * @param event {Event} A button/link click event
 * @param collection {String} The name of the collection the entity belongs to, if any
 * @param type {String} The archtype object's type or @type.
 */ 
function deleteThis(event, collection, type) {
    event.preventDefault()
    // Hold up not ready need to decide what artifacts need to be deleted.
    return

    // Confirm they want to do this
    if (!confirm(`Really delete this ${type}?\n(Cannot be undone)`)) return

    let id = ""
    //Determine which entities should be queried for to be deleted based on the archtype entity being deleted.
    switch(type){
        case "manuscript":
            // Such as ' [ Pn ] Paris, BnF, lat. 17233 ''
            id = location.hash.substr(1) // The manuscript URI
        break
        case "named-gloss":
            // Such as ' Loco et animo '

        break
        case "Range":
            // A "Gloss", such as ' Pn Mt 5 Marginal '

        break
    }
    if (confirm(`Really remove this ${type}?\n(Cannot be undone)`)) {
        
        // Note there exist Named Glosses, Glosses, and Gloss Alignments for this manuscript.  Should those be deleted?
        const historyWildcard = { "$exists": true, "$eq": [] }
        const queryObj = {
            $or: [{
                "targetCollection": collection
            }, {
                "body.targetCollection": collection
            }],
            target: httpsIdArray(id),
            "__rerum.history.next": historyWildcard
        }
        fetch(DEER.URLS.QUERY, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify(queryObj)
        })
        .then(resp => resp.json())
        .then(annos => {
            let all = annos.map(anno => {
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
                    alert("There was an issue removing this item.  Refresh the page and try again.")
                    throw err
                })
            })
            Promise.all(all).then(success => {
                location.href = "./named-glosses.html"
            })
            .catch(err => {
                alert("There was an issue removing this item.  Refresh the page and try again.")
                throw err
            })

        })
        .catch(err => {
            alert("There was an issue removing this item.  Refresh the page and try again.")
            throw err
        })
    }
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