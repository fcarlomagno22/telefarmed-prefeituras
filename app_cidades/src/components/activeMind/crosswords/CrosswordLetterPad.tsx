import * as Haptics from 'expo-haptics'
import { useRef, useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import {
  CROSSWORD_KEYBOARD_ROWS,
  getCrosswordLetterVariants,
} from '../../../config/crosswordKeyboard'
import { colors } from '../../../theme/colors'
import { playPalavrasClickSound } from '../../../utils/appSounds'
import { AppModal } from '../../AppModal'

type CrosswordLetterPadProps = {
  keySize: number
  keyGap?: number
  rowGap?: number
  padWidth: number
  disabled?: boolean
  onPickLetter: (letter: string) => void
}

type AccentMenuState = {
  baseLetter: string
  variants: readonly string[]
  anchorX: number
  anchorY: number
  anchorWidth: number
}

type CrosswordKeyProps = {
  letter: string
  keySize: number
  letterFontSize: number
  disabled: boolean
  onPickLetter: (letter: string) => void
  onOpenAccentMenu: (menu: AccentMenuState) => void
}

function CrosswordKey({
  letter,
  keySize,
  letterFontSize,
  disabled,
  onPickLetter,
  onOpenAccentMenu,
}: CrosswordKeyProps) {
  const keyRef = useRef<View>(null)
  const variants = getCrosswordLetterVariants(letter)
  const hasVariants = variants.length > 0

  function handlePress() {
    if (disabled) return
    playPalavrasClickSound()
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPickLetter(letter)
  }

  function handleLongPress() {
    if (disabled || !hasVariants) return

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    keyRef.current?.measureInWindow((x, y, width, height) => {
      onOpenAccentMenu({
        baseLetter: letter,
        variants,
        anchorX: x,
        anchorY: y,
        anchorWidth: width,
      })
    })
  }

  return (
    <View ref={keyRef} collapsable={false} style={[styles.keySlot, { width: keySize }]}>
      <Pressable
        onPress={handlePress}
        onLongPress={hasVariants ? handleLongPress : undefined}
        delayLongPress={280}
        disabled={disabled}
        style={({ pressed }) => [
          styles.letterButton,
          {
            width: keySize,
            height: keySize,
            borderRadius: Math.max(6, Math.floor(keySize * 0.14)),
          },
          hasVariants && styles.letterButtonWithVariants,
          disabled && styles.letterButtonDisabled,
          pressed && !disabled && styles.letterButtonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          hasVariants ? `Letra ${letter}. Segure para ver acentos.` : `Letra ${letter}`
        }
      >
        <Text
          style={[
            styles.letterLabel,
            {
              fontSize: letterFontSize,
              lineHeight: letterFontSize + 2,
              maxWidth: keySize - 6,
            },
            disabled && styles.letterLabelDisabled,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {letter}
        </Text>
        {hasVariants ? (
          <View
            style={[
              styles.variantDot,
              { bottom: Math.max(3, Math.floor(keySize * 0.12)) },
            ]}
          />
        ) : null}
      </Pressable>
    </View>
  )
}

type CrosswordAccentMenuProps = {
  menu: AccentMenuState | null
  onClose: () => void
  onPickLetter: (letter: string) => void
}

function CrosswordAccentMenu({ menu, onClose, onPickLetter }: CrosswordAccentMenuProps) {
  if (!menu) return null

  const popupWidth = Math.max(menu.anchorWidth, menu.variants.length * 40 + 16)
  const left = Math.max(8, menu.anchorX + menu.anchorWidth / 2 - popupWidth / 2)
  const top = menu.anchorY - 52

  function handlePick(letter: string) {
    playPalavrasClickSound()
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPickLetter(letter)
    onClose()
  }

  return (
    <AppModal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.accentBackdrop} onPress={onClose}>
        <View
          style={[
            styles.accentPopup,
            {
              left,
              top,
              width: popupWidth,
            },
          ]}
        >
          {menu.variants.map((variant) => (
            <Pressable
              key={variant}
              onPress={() => handlePick(variant)}
              style={({ pressed }) => [styles.accentOption, pressed && styles.accentOptionPressed]}
              accessibilityRole="button"
              accessibilityLabel={`Letra ${variant}`}
            >
              <Text style={styles.accentOptionLabel}>{variant}</Text>
            </Pressable>
          ))}
          <View style={[styles.accentArrow, { left: popupWidth / 2 - 6 }]} />
        </View>
      </Pressable>
    </AppModal>
  )
}

export function CrosswordLetterPad({
  keySize,
  keyGap = 4,
  rowGap = 6,
  padWidth,
  disabled = false,
  onPickLetter,
}: CrosswordLetterPadProps) {
  const [accentMenu, setAccentMenu] = useState<AccentMenuState | null>(null)
  const letterFontSize = Math.max(12, Math.min(Math.floor(keySize * 0.44), keySize - 12))
  const firstRowKeyCount = CROSSWORD_KEYBOARD_ROWS[0]?.keys.length ?? 10
  const firstRowWidth =
    firstRowKeyCount * keySize + keyGap * Math.max(0, firstRowKeyCount - 1)
  const baseRowMargin = Math.max(0, (padWidth - firstRowWidth) / 2)

  return (
    <View style={[styles.wrapper, { width: padWidth, gap: rowGap }]}>
      {CROSSWORD_KEYBOARD_ROWS.map((row, rowIndex) => {
        const rowWidth = row.keys.length * keySize + keyGap * Math.max(0, row.keys.length - 1)
        const rowIndent = baseRowMargin + (row.indentFlex ?? 0) * keySize

        return (
        <View
          key={`pad-row-${rowIndex}`}
          style={[
            styles.row,
            {
              gap: keyGap,
              width: rowWidth,
              marginLeft: rowIndent,
            },
          ]}
        >
          {row.keys.map((letter) => (
            <CrosswordKey
              key={`${rowIndex}-${letter}`}
              letter={letter}
              keySize={keySize}
              letterFontSize={letterFontSize}
              disabled={disabled}
              onPickLetter={onPickLetter}
              onOpenAccentMenu={setAccentMenu}
            />
          ))}
        </View>
        )
      })}

      <CrosswordAccentMenu
        menu={accentMenu}
        onClose={() => setAccentMenu(null)}
        onPickLetter={onPickLetter}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    flexShrink: 0,
  },
  keySlot: {
    flexGrow: 0,
    flexShrink: 0,
  },
  letterButton: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  letterButtonWithVariants: {
    borderColor: 'rgba(244, 114, 182, 0.22)',
  },
  letterButtonPressed: {
    opacity: 0.85,
  },
  letterButtonDisabled: {
    opacity: 0.45,
  },
  letterLabel: {
    color: colors.text,
    fontWeight: '700',
    includeFontPadding: false,
    textAlign: 'center',
  },
  letterLabelDisabled: {
    color: colors.textSubtle,
  },
  variantDot: {
    position: 'absolute',
    bottom: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#f9a8d4',
  },
  accentBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  accentPopup: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 14, 20, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(244, 114, 182, 0.45)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  accentOption: {
    minWidth: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 114, 182, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 114, 182, 0.25)',
  },
  accentOptionPressed: {
    opacity: 0.85,
    backgroundColor: 'rgba(244, 114, 182, 0.22)',
  },
  accentOptionLabel: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  accentArrow: {
    position: 'absolute',
    bottom: -5,
    width: 10,
    height: 10,
    backgroundColor: 'rgba(14, 14, 20, 0.98)',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(244, 114, 182, 0.45)',
    transform: [{ rotate: '45deg' }],
  },
})
