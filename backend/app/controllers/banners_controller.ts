import type { HttpContext } from '@adonisjs/core/http'
import Banner from '#models/banner'
import app from '@adonisjs/core/services/app'
import crypto from 'node:crypto'
import fs from 'node:fs'

export default class BannersController {
  /**
   * Obtener el banner activo actual (App Móvil)
   * GET /api/v1/banners/active
   */
  async getActive({ request, response }: HttpContext) {
    try {
      const appUrl = request.completeUrl().split('/api/v1')[0]
      const banner = await Banner.query().where('activo', true).orderBy('id', 'desc').first()

      if (!banner) {
        return response.ok({
          success: true,
          data: null,
        })
      }

      return response.ok({
        success: true,
        data: {
          id: banner.id,
          titulo: banner.titulo,
          imagenUrl: `${appUrl}/uploads/banners/${banner.imagenPath}`,
          enlaceRedireccion: banner.enlaceRedireccion,
          activo: banner.activo,
        },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al obtener el banner activo.',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * Listar todos los banners (Admin)
   * GET /api/v1/admin/banners
   */
  async index({ request, response }: HttpContext) {
    try {
      const appUrl = request.completeUrl().split('/api/v1')[0]
      const banners = await Banner.query().orderBy('id', 'desc')

      const data = banners.map((b) => ({
        id: b.id,
        titulo: b.titulo,
        imagenUrl: `${appUrl}/uploads/banners/${b.imagenPath}`,
        enlaceRedireccion: b.enlaceRedireccion,
        activo: b.activo,
        createdAt: b.createdAt,
      }))

      return response.ok({
        success: true,
        data,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al listar banners.',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * Registrar un nuevo banner (Admin)
   * POST /api/v1/admin/banners
   */
  async store({ request, response }: HttpContext) {
    const titulo = request.input('titulo')
    const enlaceRedireccion = request.input('enlaceRedireccion')
    const activoVal = request.input('activo')
    
    // Convertir activoVal a booleano
    const activo = activoVal === 'true' || activoVal === true || activoVal === '1'

    const image = request.file('imagen', {
      size: '4mb',
      extnames: ['jpg', 'png', 'jpeg', 'webp'],
    })

    if (!image) {
      return response.badRequest({
        success: false,
        message: 'La imagen del banner es obligatoria.',
      })
    }

    if (!image.isValid) {
      return response.badRequest({
        success: false,
        message: 'Archivo de imagen no válido o excede el límite de 4MB.',
        errors: image.errors,
      })
    }

    try {
      // Asegurar que exista la ruta public/uploads/banners
      const uploadDir = app.makePath('public/uploads/banners')
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      // Nombre único para el archivo
      const fileName = `${crypto.randomUUID()}.${image.extname}`
      await image.move(uploadDir, {
        name: fileName,
      })

      if (activo) {
        // Desactivar todos los demás banners para que solo haya uno activo
        await Banner.query().where('activo', true).update({ activo: false })
      }

      const banner = await Banner.create({
        titulo: titulo || null,
        imagenPath: fileName,
        enlaceRedireccion: enlaceRedireccion || null,
        activo,
      })

      return response.created({
        success: true,
        data: banner,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al registrar el banner.',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * Cambiar estado activo de un banner (Admin)
   * PUT /api/v1/admin/banners/:id/toggle
   */
  async toggleActive({ params, request, response }: HttpContext) {
    const { activo } = request.only(['activo'])

    if (activo === undefined) {
      return response.badRequest({
        success: false,
        message: 'El campo activo es requerido.',
      })
    }

    try {
      const banner = await Banner.findOrFail(params.id)

      if (activo) {
        // Desactivar todos los demás banners
        await Banner.query().where('activo', true).update({ activo: false })
      }

      banner.activo = activo
      await banner.save()

      return response.ok({
        success: true,
        data: banner,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al modificar el estado del banner.',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * Eliminar un banner (Admin)
   * DELETE /api/v1/admin/banners/:id
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const banner = await Banner.findOrFail(params.id)

      // Eliminar el archivo físico de imagen
      const filePath = app.makePath('public/uploads/banners', banner.imagenPath)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }

      await banner.delete()

      return response.ok({
        success: true,
        message: 'Banner eliminado correctamente.',
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error al eliminar el banner.',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * Servir archivo físico de imagen del banner
   * GET /uploads/banners/:filename
   */
  async serveImage({ params, response }: HttpContext) {
    const filename = params.filename
    const filePath = app.makePath('public/uploads/banners', filename)

    if (!fs.existsSync(filePath)) {
      return response.notFound({
        success: false,
        message: 'Archivo no encontrado.',
      })
    }

    return response.download(filePath)
  }
}
