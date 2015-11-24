<?php
namespace probase\ui\uibase\droplets\ElementQueries;

use InvalidArgumentException;
use PBJSON;

/**
 * @author Peter Slagter
 */
class ElementQueriesAttribute
{
	const ATTRIBUTE_NAME = 'data-element-queries';

	const MODE_MIN = 'min';
	const MODE_MAX = 'max';

	const PROPERTY_WIDTH = 'width';
	const PROPERTY_HEIGHT = 'height';

	/** @var string */
	private $classNameToToggleAfterInit = '';
	/** @var array */
	private $allQueries = [];

	/**
	 * @param string $mode
	 * @param string $property
	 * @param int $value
	 */
	public function addQuery($mode, $property, $value)
	{
		if ($mode != self::MODE_MAX && $mode != self::MODE_MIN) {
			throw new InvalidArgumentException;
		}

		if ($property != self::PROPERTY_HEIGHT && $property != self::PROPERTY_WIDTH) {
			throw new InvalidArgumentException;
		}

		if (!is_numeric($value)) {
			throw new InvalidArgumentException;
		}

		$this->allQueries[] = $mode . '-' . $property . ':' . $value . 'px';
	}

	/**
	 * @return string
	 */
	public function asString()
	{
		$attribute = self::ATTRIBUTE_NAME . '=';

		$attributeValue = [
			'queries' => $this->allQueries,
		];

		if ($this->classNameToToggleAfterInit) {
			$attributeValue['config'] = [
				'classNameToToggleAfterInit' => $this->classNameToToggleAfterInit
			];
		}

		$attributeValue = PBJSON::encode($attributeValue);

		return $attribute . $attributeValue;
	}

	/**
	 * @param string $classNameToToggleAfterInit
	 * @return ElementQueriesAttribute
	 */
	public function setClassNameToToggleAfterInit($classNameToToggleAfterInit)
	{
		$this->classNameToToggleAfterInit = $classNameToToggleAfterInit;
		return $this;
	}
}