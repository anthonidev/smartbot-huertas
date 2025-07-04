import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContextBase } from './entities/context-base.entity';
import { CreateContextBaseDto } from './dto/create-base-context.dto';
import { CreateQuickHelpDto } from './dto/create-quick-help.dto';
import { QuickHelp } from './entities/quick-help.entity';
import { SystemGuide } from './entities/system-guide.entity';
import { CreateSystemGuideDto } from './dto/create-system-guide.dto';
import { RoleContext } from './entities/role-context.entity';
import { CreateRoleContextDto } from './dto/create-role-context.dto';

@Injectable()
export class ContextService {
  constructor(
    @InjectModel(ContextBase.name)
    private readonly contextBaseModel: Model<ContextBase>,
    @InjectModel(QuickHelp.name)
    private readonly quickHelpModel: Model<QuickHelp>,
    @InjectModel(SystemGuide.name)
    private readonly systemGuideModel: Model<SystemGuide>,
    @InjectModel(RoleContext.name)
    private readonly roleContextModel: Model<RoleContext>,
  ) {}

  async createContextBase(createContextBaseDto: CreateContextBaseDto) {
    try {
      const { key, value, isActive = true, description } = createContextBaseDto;

      // Buscar si ya existe un registro con la misma key
      const existingContext = await this.contextBaseModel.findOne({ key });

      if (existingContext) {
        // Si existe, actualizar con los nuevos valores
        existingContext.value = value;
        existingContext.isActive = isActive;
        if (description !== undefined) {
          existingContext.description = description;
        }

        const updatedContext = await existingContext.save();

        return {
          success: true,
          message: `Context base con key '${key}' actualizado exitosamente`,
          data: updatedContext,
          action: 'updated',
        };
      } else {
        // Si no existe, crear nuevo registro
        const newContext = new this.contextBaseModel({
          key,
          value,
          isActive,
          description,
        });

        const savedContext = await newContext.save();

        return {
          success: true,
          message: `Context base con key '${key}' creado exitosamente`,
          data: savedContext,
          action: 'created',
        };
      }
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: 'Error al crear/actualizar context base',
        error: error.message,
      });
    }
  }

  async getContextBaseByKey(key: string): Promise<ContextBase | null> {
    return this.contextBaseModel.findOne({ key, isActive: true });
  }

  async getAllActiveContextBase(): Promise<ContextBase[]> {
    return this.contextBaseModel.find({ isActive: true });
  }

  async createQuickHelp(createQuickHelpDto: CreateQuickHelpDto) {
    try {
      const { roleCode, questions, keywords } = createQuickHelpDto;

      // Eliminar todas las preguntas existentes para este rol
      await this.quickHelpModel.deleteMany({ roleCode });

      // Crear las nuevas preguntas
      const quickHelpData = questions.map((question, index) => ({
        roleCode,
        question,
        order: index + 1,
        keywords: keywords || [],
        isActive: true,
      }));

      const createdQuickHelp =
        await this.quickHelpModel.insertMany(quickHelpData);

      return {
        success: true,
        message: `Quick Help para rol '${roleCode}' creado exitosamente`,
        data: {
          roleCode,
          questionsCount: createdQuickHelp.length,
          questions: createdQuickHelp.map((qh) => ({
            id: qh._id,
            question: qh.question,
            order: qh.order,
          })),
        },
        action: 'created',
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: 'Error al crear Quick Help',
        error: error.message,
      });
    }
  }
  async getQuickHelpByRole(roleCode: string): Promise<QuickHelp[]> {
    return this.quickHelpModel
      .find({ roleCode, isActive: true })
      .sort({ order: 1 });
  }
  async createSystemGuide(createSystemGuideDto: CreateSystemGuideDto) {
    try {
      const {
        guideKey,
        title,
        applicableRoles,
        steps,
        description,
        metadata,
        priority = 0,
      } = createSystemGuideDto;

      // Buscar si ya existe una guía con la misma guideKey
      const existingGuide = await this.systemGuideModel.findOne({ guideKey });

      if (existingGuide) {
        // Si existe, actualizar con los nuevos valores
        existingGuide.title = title;
        existingGuide.applicableRoles = applicableRoles;
        existingGuide.steps = steps;
        existingGuide.priority = priority;
        if (description !== undefined) {
          existingGuide.description = description;
        }
        if (metadata !== undefined) {
          existingGuide.metadata = metadata;
        }

        const updatedGuide = await existingGuide.save();

        return {
          success: true,
          message: `System Guide con key '${guideKey}' actualizado exitosamente`,
          data: {
            id: updatedGuide._id,
            guideKey: updatedGuide.guideKey,
            title: updatedGuide.title,
            applicableRoles: updatedGuide.applicableRoles,
            stepsCount: updatedGuide.steps.length,
            priority: updatedGuide.priority,
          },
          action: 'updated',
        };
      } else {
        // Si no existe, crear nueva guía
        const newGuide = new this.systemGuideModel({
          guideKey,
          title,
          applicableRoles,
          steps,
          description,
          metadata,
          priority,
          isActive: true,
        });

        const savedGuide = await newGuide.save();

        return {
          success: true,
          message: `System Guide con key '${guideKey}' creado exitosamente`,
          data: {
            id: savedGuide._id,
            guideKey: savedGuide.guideKey,
            title: savedGuide.title,
            applicableRoles: savedGuide.applicableRoles,
            stepsCount: savedGuide.steps.length,
            priority: savedGuide.priority,
          },
          action: 'created',
        };
      }
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: 'Error al crear/actualizar System Guide',
        error: error.message,
      });
    }
  }

  async getSystemGuidesByRole(roleCode: string): Promise<SystemGuide[]> {
    return this.systemGuideModel
      .find({
        applicableRoles: { $in: [roleCode, 'ALL'] },
        isActive: true,
      })
      .sort({ priority: -1, title: 1 });
  }

  async getSystemGuideByKey(guideKey: string): Promise<SystemGuide | null> {
    return this.systemGuideModel.findOne({ guideKey, isActive: true });
  }

  async createRoleContext(createRoleContextDto: CreateRoleContextDto) {
    try {
      const {
        roleCode,
        name,
        description,
        capabilities,
        commonQueries,
        workflows,
        metadata,
        isActive = true,
      } = createRoleContextDto;

      // Buscar si ya existe un contexto para este rol
      const existingRoleContext = await this.roleContextModel.findOne({
        roleCode,
      });

      if (existingRoleContext) {
        // Si existe, actualizar con los nuevos valores
        existingRoleContext.name = name;
        existingRoleContext.description = description;
        existingRoleContext.capabilities = capabilities;
        existingRoleContext.commonQueries = commonQueries;
        existingRoleContext.workflows = workflows;
        existingRoleContext.isActive = isActive;
        if (metadata !== undefined) {
          existingRoleContext.metadata = metadata;
        }

        const updatedRoleContext = await existingRoleContext.save();

        return {
          success: true,
          message: `Role Context para rol '${roleCode}' actualizado exitosamente`,
          data: {
            id: updatedRoleContext._id,
            roleCode: updatedRoleContext.roleCode,
            name: updatedRoleContext.name,
            description: updatedRoleContext.description,
            capabilitiesCount: updatedRoleContext.capabilities.length,
            commonQueriesCount: updatedRoleContext.commonQueries.length,
            workflowsCount: updatedRoleContext.workflows.length,
            isActive: updatedRoleContext.isActive,
          },
          action: 'updated',
        };
      } else {
        // Si no existe, crear nuevo contexto de rol
        const newRoleContext = new this.roleContextModel({
          roleCode,
          name,
          description,
          capabilities,
          commonQueries,
          workflows,
          metadata,
          isActive,
        });

        const savedRoleContext = await newRoleContext.save();

        return {
          success: true,
          message: `Role Context para rol '${roleCode}' creado exitosamente`,
          data: {
            id: savedRoleContext._id,
            roleCode: savedRoleContext.roleCode,
            name: savedRoleContext.name,
            description: savedRoleContext.description,
            capabilitiesCount: savedRoleContext.capabilities.length,
            commonQueriesCount: savedRoleContext.commonQueries.length,
            workflowsCount: savedRoleContext.workflows.length,
            isActive: savedRoleContext.isActive,
          },
          action: 'created',
        };
      }
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: 'Error al crear/actualizar Role Context',
        error: error.message,
      });
    }
  }
  async getRoleContextByCode(roleCode: string): Promise<RoleContext | null> {
    return this.roleContextModel.findOne({ roleCode, isActive: true });
  }

  async getAllActiveRoleContexts(): Promise<RoleContext[]> {
    return this.roleContextModel.find({ isActive: true });
  }
}
