export default async function handler(req, res) {
  const method = req.method
  const { id } = req.query
  switch (method) {
    case 'GET':
      if (id) {
        return res.status(200).json(
          await getRunById(id)
        )
      }
      return res.status(404).json({ message: 'Run ID is required' })
    case 'POST':
      return res.status(200).json(
        await createRun(req.body)
      )
      case 'PUT':
        if (id) {
          return res.status(200).json(
            await updateRun(id, req.body)
          )
        }
        return res.status(404).json({ message: 'Run not found' })
      case 'DELETE':
        if (id) {
          return res.status(200).json(
            await deleteRun(id)
          )
        }
        return res.status(404).json({ message: 'Run ID is required' })
    default:
      return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function getRunById(id) {
  return {
    id: id,
    name: `Run ${id}`,
    description: `Run ${id} description`,
  }
}

async function createRun(run) {
  return {
    id: run.id,
    name: run.name,
    description: run.description,
  }
}

async function updateRun(id, run) {
  return {
    id: id,
    name: run.name,
    description: run.description,
  }
}

async function deleteRun(id) {
  return {
    id: id,
    name: `Run ${id}`,
    description: `Run ${id} description`,
  }
}