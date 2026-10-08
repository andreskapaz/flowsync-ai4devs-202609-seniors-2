import User from '#models/user'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * Lo que cada tarea muestra de su responsable. Cubre los tres scenarios del
 * requisito «Lo que cada tarea muestra de su responsable» de
 * `openspec/specs/tasks/spec.md`: responsable identificable, la tarea no filtra
 * datos de cuenta (suelta y en la lista) y responsable sin nombre.
 */
test.group('Tasks | responsable', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const today = '2026-10-08'

  async function sesion(client: any, fullName: string | null, email = 'ada@example.com') {
    await User.create({ fullName, email, password: 'secreto123' })

    const response = await client.post('/api/v1/auth/login').json({ email, password: 'secreto123' })

    return response.body().data.token as string
  }

  async function tareaDe(client: any, token: string) {
    const response = await client
      .post('/api/v1/tasks')
      .header('Authorization', `Bearer ${token}`)
      .json({ title: 'Revisar el informe' })

    return response.body().data.id as number
  }

  test('la tarea trae el nombre y las iniciales de su responsable', async ({ client, assert }) => {
    const token = await sesion(client, 'Ada Lovelace')
    const id = await tareaDe(client, token)

    const response = await client
      .get(`/api/v1/tasks/${id}`)
      .qs({ today })
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)

    const { assignee } = response.body().data
    assert.equal(assignee.fullName, 'Ada Lovelace')
    assert.equal(assignee.initials, 'AL')
  })

  test('el responsable no trae el email ni datos de acceso, ni suelta ni en la lista', async ({
    client,
    assert,
  }) => {
    const token = await sesion(client, 'Ada Lovelace')
    const id = await tareaDe(client, token)

    const suelta = await client
      .get(`/api/v1/tasks/${id}`)
      .qs({ today })
      .header('Authorization', `Bearer ${token}`)

    const lista = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)

    suelta.assertStatus(200)
    lista.assertStatus(200)

    const enLista = lista.body().data.find((tarea: { id: number }) => tarea.id === id)
    assert.exists(enLista)

    // Se comprueban las dos lecturas a la vez y no una detrás de otra: si la
    // primera fallara, la segunda quedaría sin mirar y el informe diría la mitad.
    const datosDeAcceso = ['email', 'password']
    const fugas = (assignee: Record<string, unknown>) => [
      ...datosDeAcceso.filter((campo) => campo in assignee),
      ...(JSON.stringify(assignee).includes('ada@example.com') ? ['valor del email'] : []),
    ]

    assert.deepEqual(
      { suelta: fugas(suelta.body().data.assignee), lista: fugas(enLista.assignee) },
      { suelta: [], lista: [] }
    )
  })

  test('un responsable sin nombre llega con nombre nulo y con iniciales', async ({
    client,
    assert,
  }) => {
    const token = await sesion(client, null)
    const id = await tareaDe(client, token)

    const response = await client
      .get(`/api/v1/tasks/${id}`)
      .qs({ today })
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)

    const { assignee } = response.body().data
    assert.isNull(assignee.fullName)
    assert.isString(assignee.initials)
    assert.isNotEmpty(assignee.initials)
  })
})
