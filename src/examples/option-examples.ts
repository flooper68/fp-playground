import { None, Option, Some } from "../lib/implementations/option";
import { Opaque } from "../lib/opaque";

export type Uuid = Opaque<string, "Uuid">;

function Uuid(value: string): Uuid {
  return value as Uuid;
}

export type AreaUuid = Opaque<string, "AreaUuid">;

function AreaUuid(value: string): AreaUuid {
  return value as AreaUuid;
}

export type AreaName = Opaque<string, "AreaName">;

function AreaName(value: string): Option<AreaName> {
  if (value.length < 1) {
    return None.of();
  }

  return Some.of(value as AreaName);
}

export type Token = Opaque<string, "Token">;

function Token(value: string) {
  if (value.length < 10) {
    return None.of();
  }

  return Some.of(value as Token);
}

type AreasList = ReadonlyArray<{
  uuid: AreaUuid;
  name: AreaName;
}>;

export type Base = Opaque<
  {
    uuid: Uuid;
    areas: AreasList;
  },
  "Base"
>;

function Base(props: { uuid: Uuid; areas: AreasList }) {
  if (props.areas.length !== 1) {
    return None.of();
  }

  return Some.of({
    uuid: props.uuid,
    areas: props.areas,
  } as Base);
}

enum EntityStatus {
  New = "new",
  Active = "active",
  Deleted = "deleted",
}

export type NewEntity = {
  status: EntityStatus.New;
  base: Base;
};

function isNewEntity(entity: Entity): entity is NewEntity {
  return entity.status === EntityStatus.New;
}

export type ActiveEntity = {
  status: EntityStatus.Active;
  base: Base;
  token: Token;
};

function isActiveEntity(entity: Entity): entity is ActiveEntity {
  return entity.status === EntityStatus.Active;
}

export type DeletedEntity = {
  status: EntityStatus.Deleted;
  base: Base;
};

function isDeletedEntity(entity: Entity): entity is DeletedEntity {
  return entity.status === EntityStatus.Deleted;
}

export type EditableEntity = NewEntity | ActiveEntity;

function isEditableEntity(entity: Entity): entity is EditableEntity {
  return isNewEntity(entity) || isActiveEntity(entity);
}

export type Entity = EditableEntity | DeletedEntity;

function updateBase(
  entity: EditableEntity,
  areas: AreasList
): Option<EditableEntity> {
  const base = Base({ uuid: entity.base.uuid, areas });

  return base.map((base) => {
    return {
      ...entity,
      base,
    };
  });
}

function activate(entity: NewEntity, token: string): Option<ActiveEntity> {
  return Token(token).map((token) => {
    return {
      status: EntityStatus.Active,
      base: entity.base,
      token,
    };
  });
}

function deleteEntity(entity: EditableEntity): Option<DeletedEntity> {
  return Some.of({
    status: EntityStatus.Deleted,
    base: entity.base,
  });
}

function assertState<T extends Entity>(guard: (entity: Entity) => entity is T) {
  return function (entity: Entity) {
    if (!guard(entity)) {
      return None.of();
    }

    return Some.of(entity);
  };
}

const assertEditableEntity = assertState(isEditableEntity);
const assertNewEntity = assertState(isNewEntity);
const assertDeletedEntity = assertState(isDeletedEntity);

function getExampleAreaList(): AreasList {
  return [
    {
      uuid: AreaUuid("some-uuid"),
      name: AreaName("some-name").unwrap(),
    },
  ];
}

function getExampleEntity(): Option<Entity> {
  return Some.of({
    status: EntityStatus.New,
    base: Base({
      uuid: Uuid("some-uuid"),
      areas: [
        {
          uuid: AreaUuid("some-uuid"),
          name: AreaName("some-name").unwrap(),
        },
      ],
    }).unwrap(),
  });
}

function runOptionExample(token: string) {
  const entity = getExampleEntity();
  const firstAreas = getExampleAreaList();
  const secondAreas = getExampleAreaList();

  const result = entity
    .chain(assertEditableEntity)
    .chain((entity) => {
      return updateBase(entity, firstAreas);
    })
    .chain(assertNewEntity)
    .chain((entity) => {
      return activate(entity, token);
    })
    .chain((entity) => {
      return updateBase(entity, secondAreas);
    })
    .chain((entity) => {
      return deleteEntity(entity);
    })
    .fold(
      (value) => [`Result of the operation:`, value],
      () => [`The operation failed!`]
    );

  console.log(...result);
}

export function runSuccessOptionExample() {
  runOptionExample("some-tokenasdgadsga");
}

export function runFailureOptionExample() {
  runOptionExample("short");
}
