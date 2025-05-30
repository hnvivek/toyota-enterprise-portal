import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Product } from '../models/Product';
import { auth } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = Router();

// Get all products
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const productRepository = AppDataSource.getRepository(Product);
    const products = await productRepository.find({
      order: { createdAt: 'DESC' }
    });
    console.log('Products API called - found products:', products.length);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Get single product by ID
router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const productRepository = AppDataSource.getRepository(Product);
    const product = await productRepository.findOne({
      where: { id: parseInt(req.params.id) }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

// Create new product
router.post('/', auth, [
  body('name').notEmpty().withMessage('Product name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('price').isNumeric().withMessage('Price must be a valid number'),
  body('category').notEmpty().withMessage('Category is required'),
], async (req: Request, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, description, price, category } = req.body;
    const productRepository = AppDataSource.getRepository(Product);

    // Check if product with same name already exists
    const existingProduct = await productRepository.findOne({
      where: { name }
    });

    if (existingProduct) {
      return res.status(400).json({ 
        message: 'Product with this name already exists' 
      });
    }

    // Create new product
    const product = productRepository.create({
      name,
      description,
      price: parseFloat(price),
      category
    });

    const savedProduct = await productRepository.save(product);
    console.log('Created new product:', savedProduct.name);

    res.status(201).json({
      message: 'Product created successfully',
      product: savedProduct
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
});

// Update product
router.put('/:id', auth, [
  body('name').notEmpty().withMessage('Product name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('price').isNumeric().withMessage('Price must be a valid number'),
  body('category').notEmpty().withMessage('Category is required'),
], async (req: Request, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, description, price, category } = req.body;
    const productRepository = AppDataSource.getRepository(Product);
    const productId = parseInt(req.params.id);

    // Find the product
    const product = await productRepository.findOne({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if another product with the same name exists (excluding current product)
    const existingProduct = await productRepository.findOne({
      where: { name }
    });

    if (existingProduct && existingProduct.id !== productId) {
      return res.status(400).json({ 
        message: 'Another product with this name already exists' 
      });
    }

    // Update product
    product.name = name;
    product.description = description;
    product.price = parseFloat(price);
    product.category = category;

    const updatedProduct = await productRepository.save(product);
    console.log('Updated product:', updatedProduct.name);

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

// Delete product
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const productRepository = AppDataSource.getRepository(Product);
    const productId = parseInt(req.params.id);

    // Find the product
    const product = await productRepository.findOne({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // TODO: Add check for events using this product before deletion
    // For now, we'll allow deletion but in production you might want to prevent
    // deletion of products that are associated with events

    await productRepository.remove(product);
    console.log('Deleted product:', product.name);

    res.json({
      message: 'Product deleted successfully',
      productName: product.name
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

export default router; 