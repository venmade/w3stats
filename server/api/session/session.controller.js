/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/session              ->  index
 * POST    /api/session              ->  create
 * GET     /api/session/:id          ->  show
 * PUT     /api/session/:id          ->  upsert
 * PATCH   /api/session/:id          ->  patch
 * DELETE  /api/session/:id          ->  destroy
 */

'use strict';

import jsonpatch from 'fast-json-patch';
import {Sessions} from '../../sqldb';

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    if(entity) {
      return res.status(statusCode).json(entity);
    }
    return null;
  };
}

function patchUpdates(patches) {
  return function(entity) {
    try {
      jsonpatch.apply(entity, patches, /*validate*/ true);
    } catch(err) {
      return Promise.reject(err);
    }

    return entity.save();
  };
}

function removeEntity(res) {
  return function(entity) {
    if(entity) {
      return entity.destroy()
        .then(() => {
          res.status(204).end();
        });
    }
  };
}

function handleEntityNotFound(res) {
  return function(entity) {
    if(!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
}

// Gets a list of session
export function index(req, res) {
  return Sessions.findAll()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a single Sessions from the DB
export function show(req, res) {
  return Sessions.find({
    where: {
      id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Creates a new Sessions in the DB
export function create(req, res) {
  return Sessions.create(req.body)
    .then(respondWithResult(res, 201))
    .catch(handleError(res));
}

// Upserts the given Sessions in the DB at the specified ID
export function upsert(req, res) {
  if(req.body.id) {
    delete req.body.id;
  }

  return Sessions.upsert(req.body, {
    where: {
      id: req.params.id
    }
  })
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Updates an existing Sessions in the DB
export function patch(req, res) {
  if(req.body.id) {
    delete req.body.id;
  }
  return Sessions.find({
    where: {
      id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(patchUpdates(req.body))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Deletes a Sessions from the DB
export function destroy(req, res) {
  return Sessions.find({
    where: {
      id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}
