import type { Application } from '@nocobase/app-server/application';
import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  describeRoute,
  listResponse,
} from '@nocobase/app-server/router';
import type { Hono } from 'hono';

import { ORG_SETTINGS, OrgError } from '../../providers/org/index.js';
import {
  CreateGradeInput,
  CreatePositionInput,
  Grade,
  GradeParams,
  OptionsQuery,
  Position,
  PositionParams,
  UpdateGradeInput,
  UpdatePositionInput,
} from './schemas.js';
import {
  createOrgRouter,
  defined,
  describeSettings,
  notFound,
  orgRouteServices,
  requireSettings,
  type OrgEnv,
} from './shared.js';

const OPTIONS_DESCRIPTION =
  'Open to every signed-in user, for the pickers of employee and application forms; the catalogue is not confidential. A bounded list: not paged, answers `meta.total`.';

/** Positions (岗位), mounted at `/positions`. */
export function createPositionRoutes(app: Application): Hono<OrgEnv> {
  const services = orgRouteServices(app);
  const { organization } = services;
  const routes = createOrgRouter(app);
  const ITEM = ORG_SETTINGS.positions;
  const read = requireSettings(ITEM, 'read');
  const update = requireSettings(ITEM, 'update');
  const tags = ['Positions'];
  const UPDATE = describeSettings(ITEM, 'update');
  const positionNotFound = notFound(
    'The position does not exist (`POSITION_NOT_FOUND`).',
  );
  const conflict = apiErrorResponse(
    409,
    'The code is already used (`POSITION_CODE_EXISTS`).',
  );

  routes.get(
    '/options',
    describeRoute({
      tags,
      summary: 'List position options',
      operationId: 'listPositionOptions',
      description: `Active positions (with \`includeInactive=true\`, every position), by sort order. ${OPTIONS_DESCRIPTION}`,
      responses: {
        200: listResponse(Position),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
      },
    }),
    apiValidator('query', OptionsQuery),
    async (c) => {
      const { includeInactive } = c.req.valid('query');
      const data = (await organization.listPositions()).filter(
        (position) => includeInactive || position.active,
      );
      return c.json({ data, meta: { total: data.length } });
    },
  );

  routes.get(
    '/',
    read,
    describeRoute({
      tags,
      summary: 'List positions',
      operationId: 'listPositions',
      description: `Every position, active or not, by sort order. A bounded list: not paged, answers \`meta.total\`. ${describeSettings(ITEM, 'read')}`,
      responses: { 200: listResponse(Position), ...apiErrorResponses },
    }),
    async (c) => {
      const data = await organization.listPositions();
      return c.json({ data, meta: { total: data.length } });
    },
  );

  routes.post(
    '/',
    update,
    describeRoute({
      tags,
      summary: 'Create a position',
      operationId: 'createPosition',
      description: `Records an audit entry. ${UPDATE}`,
      responses: {
        201: dataResponse(Position, 'The created position.'),
        ...apiErrorResponses,
        409: conflict,
      },
    }),
    apiValidator('json', CreatePositionInput),
    async (c) =>
      c.json(
        {
          data: await organization.createPosition(
            defined(c.req.valid('json')),
            services.actor(c),
          ),
        },
        201,
      ),
  );

  routes.get(
    '/:positionId',
    read,
    describeRoute({
      tags,
      summary: 'Get a position',
      operationId: 'getPosition',
      description: describeSettings(ITEM, 'read'),
      responses: {
        200: dataResponse(Position),
        ...apiErrorResponses,
        404: positionNotFound,
      },
    }),
    apiValidator('param', PositionParams),
    async (c) => {
      const { positionId } = c.req.valid('param');
      const position = (await organization.listPositions()).find(
        (row) => row.id === positionId,
      );
      if (!position)
        throw new OrgError(
          'POSITION_NOT_FOUND',
          `Position "${positionId}" does not exist.`,
        );
      return c.json({ data: position });
    },
  );

  routes.patch(
    '/:positionId',
    update,
    describeRoute({
      tags,
      summary: 'Update a position',
      operationId: 'updatePosition',
      description: `Changes only the fields the body names. Records an audit entry. ${UPDATE}`,
      responses: {
        200: dataResponse(Position),
        ...apiErrorResponses,
        404: positionNotFound,
        409: conflict,
      },
    }),
    apiValidator('param', PositionParams),
    apiValidator('json', UpdatePositionInput),
    async (c) =>
      c.json({
        data: await organization.updatePosition(
          c.req.valid('param').positionId,
          defined(c.req.valid('json')),
          services.actor(c),
        ),
      }),
  );

  for (const [verb, active, name] of [
    ['enable', true, 'Enable'],
    ['disable', false, 'Disable'],
  ] as const) {
    routes.post(
      `/:positionId/${verb}`,
      update,
      describeRoute({
        tags,
        summary: `${name} a position`,
        operationId: `${verb}Position`,
        description: `A disabled position is kept for the records naming it but is no longer offered in pickers. Records an audit entry. ${UPDATE}`,
        responses: {
          200: dataResponse(Position),
          ...apiErrorResponses,
          404: positionNotFound,
        },
      }),
      apiValidator('param', PositionParams),
      async (c) =>
        c.json({
          data: await organization.setPositionActive(
            c.req.valid('param').positionId,
            active,
            services.actor(c),
          ),
        }),
    );
  }

  return routes;
}

/** Grades (职级), mounted at `/grades`. */
export function createGradeRoutes(app: Application): Hono<OrgEnv> {
  const services = orgRouteServices(app);
  const { organization } = services;
  const routes = createOrgRouter(app);
  const ITEM = ORG_SETTINGS.grades;
  const read = requireSettings(ITEM, 'read');
  const update = requireSettings(ITEM, 'update');
  const tags = ['Grades'];
  const UPDATE = describeSettings(ITEM, 'update');
  const gradeNotFound = notFound(
    'The grade does not exist (`GRADE_NOT_FOUND`).',
  );
  const conflict = apiErrorResponse(
    409,
    'The code is already used (`GRADE_CODE_EXISTS`).',
  );

  routes.get(
    '/options',
    describeRoute({
      tags,
      summary: 'List grade options',
      operationId: 'listGradeOptions',
      description: `Active grades (with \`includeInactive=true\`, every grade), by rank. ${OPTIONS_DESCRIPTION}`,
      responses: {
        200: listResponse(Grade),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
      },
    }),
    apiValidator('query', OptionsQuery),
    async (c) => {
      const { includeInactive } = c.req.valid('query');
      const data = (await organization.listGrades()).filter(
        (grade) => includeInactive || grade.active,
      );
      return c.json({ data, meta: { total: data.length } });
    },
  );

  routes.get(
    '/',
    read,
    describeRoute({
      tags,
      summary: 'List grades',
      operationId: 'listGrades',
      description: `Every grade, active or not, by rank. A bounded list: not paged, answers \`meta.total\`. ${describeSettings(ITEM, 'read')}`,
      responses: { 200: listResponse(Grade), ...apiErrorResponses },
    }),
    async (c) => {
      const data = await organization.listGrades();
      return c.json({ data, meta: { total: data.length } });
    },
  );

  routes.post(
    '/',
    update,
    describeRoute({
      tags,
      summary: 'Create a grade',
      operationId: 'createGrade',
      description: `Records an audit entry. ${UPDATE}`,
      responses: {
        201: dataResponse(Grade, 'The created grade.'),
        ...apiErrorResponses,
        409: conflict,
      },
    }),
    apiValidator('json', CreateGradeInput),
    async (c) =>
      c.json(
        {
          data: await organization.createGrade(
            c.req.valid('json'),
            services.actor(c),
          ),
        },
        201,
      ),
  );

  routes.get(
    '/:gradeId',
    read,
    describeRoute({
      tags,
      summary: 'Get a grade',
      operationId: 'getGrade',
      description: describeSettings(ITEM, 'read'),
      responses: {
        200: dataResponse(Grade),
        ...apiErrorResponses,
        404: gradeNotFound,
      },
    }),
    apiValidator('param', GradeParams),
    async (c) => {
      const { gradeId } = c.req.valid('param');
      const grade = (await organization.listGrades()).find(
        (row) => row.id === gradeId,
      );
      if (!grade)
        throw new OrgError(
          'GRADE_NOT_FOUND',
          `Grade "${gradeId}" does not exist.`,
        );
      return c.json({ data: grade });
    },
  );

  routes.patch(
    '/:gradeId',
    update,
    describeRoute({
      tags,
      summary: 'Update a grade',
      operationId: 'updateGrade',
      description: `Changes only the fields the body names. Records an audit entry. ${UPDATE}`,
      responses: {
        200: dataResponse(Grade),
        ...apiErrorResponses,
        404: gradeNotFound,
        409: conflict,
      },
    }),
    apiValidator('param', GradeParams),
    apiValidator('json', UpdateGradeInput),
    async (c) =>
      c.json({
        data: await organization.updateGrade(
          c.req.valid('param').gradeId,
          defined(c.req.valid('json')),
          services.actor(c),
        ),
      }),
  );

  for (const [verb, active, name] of [
    ['enable', true, 'Enable'],
    ['disable', false, 'Disable'],
  ] as const) {
    routes.post(
      `/:gradeId/${verb}`,
      update,
      describeRoute({
        tags,
        summary: `${name} a grade`,
        operationId: `${verb}Grade`,
        description: `A disabled grade is kept for the records naming it but is no longer offered in pickers. Records an audit entry. ${UPDATE}`,
        responses: {
          200: dataResponse(Grade),
          ...apiErrorResponses,
          404: gradeNotFound,
        },
      }),
      apiValidator('param', GradeParams),
      async (c) =>
        c.json({
          data: await organization.setGradeActive(
            c.req.valid('param').gradeId,
            active,
            services.actor(c),
          ),
        }),
    );
  }

  return routes;
}
